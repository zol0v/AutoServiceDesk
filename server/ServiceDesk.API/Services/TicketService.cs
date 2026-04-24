using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Data;
using ServiceDesk.API.DTOs.Common;
using ServiceDesk.API.DTOs.Tickets;
using ServiceDesk.API.Exceptions;
using ServiceDesk.API.Mappings;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Services;

public class TicketService : ITicketService
{
    private readonly AppDbContext _db;
    private readonly ILogger<TicketService> _logger;

    public TicketService(AppDbContext db, ILogger<TicketService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<TicketResponse> CreateAsync(
        CreateTicketRequest request,
        string currentUserId,
        string currentRole)
    {
        if (!string.Equals(currentRole, "Client", StringComparison.Ordinal))
        {
            throw new ForbiddenException("Только клиент может создавать обращения.");
        }

        var title = NormalizeRequiredText(request.Title, "Заголовок обращения");
        var description = NormalizeRequiredText(request.Description, "Описание проблемы");

        var category = await _db.Categories
            .FirstOrDefaultAsync(item => item.Id == request.CategoryId && item.IsActive);

        if (category is null)
        {
            throw new BusinessException("Выбранная категория не найдена или отключена.");
        }

        var author = await _db.Users.FirstOrDefaultAsync(user => user.Id == currentUserId);
        if (author is null)
        {
            throw new UnauthorizedException("Текущий пользователь не найден.");
        }

        var ticket = new Ticket
        {
            Title = title,
            Description = description,
            CategoryId = category.Id,
            AuthorId = author.Id,
            Priority = request.Priority,
            Status = TicketStatus.New,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Tickets.Add(ticket);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Ticket {TicketId} created by user {UserId} in category {CategoryId}",
            ticket.Id,
            author.Id,
            category.Id);

        var createdTicket = await BuildTicketQuery()
            .AsNoTracking()
            .FirstAsync(item => item.Id == ticket.Id);

        return createdTicket.ToResponse();
    }

    public async Task<PagedResponse<TicketResponse>> GetListAsync(
        TicketsQuery query,
        string currentUserId,
        string currentRole)
    {
        if (query.AssignedToMe == true && query.UnassignedOnly == true)
        {
            throw new BusinessException("Нельзя одновременно запрашивать свои и свободные заявки.");
        }

        var status = ParseStatus(query.Status);

        var ticketsQuery = BuildTicketQuery()
            .AsNoTracking()
            .AsQueryable();

        if (string.Equals(currentRole, "Client", StringComparison.Ordinal))
        {
            ticketsQuery = ticketsQuery.Where(ticket => ticket.AuthorId == currentUserId);
        }
        else if (string.Equals(currentRole, "Master", StringComparison.Ordinal))
        {
            if (query.UnassignedOnly == true)
            {
                ticketsQuery = ticketsQuery.Where(ticket => ticket.AssigneeId == null);
            }

            if (query.AssignedToMe == true)
            {
                ticketsQuery = ticketsQuery.Where(ticket => ticket.AssigneeId == currentUserId);

                if (!status.HasValue)
                {
                    ticketsQuery = ticketsQuery.Where(ticket =>
                        ticket.Status == TicketStatus.New ||
                        ticket.Status == TicketStatus.InProgress);
                }
            }
        }

        if (status.HasValue)
        {
            ticketsQuery = ticketsQuery.Where(ticket => ticket.Status == status.Value);
        }

        if (query.CategoryId.HasValue)
        {
            ticketsQuery = ticketsQuery.Where(ticket => ticket.CategoryId == query.CategoryId.Value);
        }

        ticketsQuery = ticketsQuery.OrderByDescending(ticket => ticket.CreatedAt);

        var totalCount = await ticketsQuery.CountAsync();
        var tickets = await ticketsQuery.ToListAsync();

        return new PagedResponse<TicketResponse>
        {
            Items = tickets.Select(ticket => ticket.ToResponse()).ToList(),
            TotalCount = totalCount
        };
    }

    public async Task<TicketResponse> GetByIdAsync(
        int id,
        string currentUserId,
        string currentRole)
    {
        var ticket = await BuildTicketQuery()
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id)
            ?? throw new NotFoundException($"Обращение с идентификатором {id} не найдено.");

        if (string.Equals(currentRole, "Client", StringComparison.Ordinal) &&
            ticket.AuthorId != currentUserId)
        {
            throw new ForbiddenException("Вы не можете просматривать чужие обращения.");
        }

        if (string.Equals(currentRole, "Master", StringComparison.Ordinal) &&
            ticket.AssigneeId is not null &&
            ticket.AssigneeId != currentUserId)
        {
            throw new ForbiddenException("Вы не можете просматривать заявку, назначенную другому мастеру.");
        }

        return ticket.ToResponse();
    }

    public async Task<TicketResponse> AssignToMeAsync(
        int id,
        string currentUserId,
        string currentRole)
    {
        if (!string.Equals(currentRole, "Master", StringComparison.Ordinal))
        {
            throw new ForbiddenException("Только мастер может брать заявки в работу.");
        }

        var ticket = await BuildTicketQuery()
            .FirstOrDefaultAsync(item => item.Id == id)
            ?? throw new NotFoundException($"Обращение с идентификатором {id} не найдено.");

        if (ticket.AssigneeId == currentUserId)
        {
            throw new BusinessException("Эта заявка уже назначена вам.");
        }

        if (ticket.AssigneeId is not null && ticket.AssigneeId != currentUserId)
        {
            throw new ConflictException("Заявка уже назначена другому мастеру.");
        }

        if (ticket.Status != TicketStatus.New)
        {
            throw new BusinessException("Взять в работу можно только новую заявку.");
        }

        ticket.AssigneeId = currentUserId;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Ticket {TicketId} assigned to master {MasterId}",
            ticket.Id,
            currentUserId);

        var updatedTicket = await BuildTicketQuery()
            .AsNoTracking()
            .FirstAsync(item => item.Id == ticket.Id);

        return updatedTicket.ToResponse();
    }

    public async Task<TicketResponse> ChangeStatusAsync(
        int id,
        ChangeStatusRequest request,
        string currentUserId,
        string currentRole)
    {
        if (!string.Equals(currentRole, "Master", StringComparison.Ordinal))
        {
            throw new ForbiddenException("Только мастер может менять статус заявки.");
        }

        var ticket = await BuildTicketQuery()
            .FirstOrDefaultAsync(item => item.Id == id)
            ?? throw new NotFoundException($"Обращение с идентификатором {id} не найдено.");

        if (ticket.AssigneeId != currentUserId)
        {
            throw new ForbiddenException("Вы можете менять статус только своих заявок.");
        }

        var nextStatus = ParseRequiredStatus(request.Status);

        if (ticket.Status == nextStatus)
        {
            throw new BusinessException("Новый статус совпадает с текущим.");
        }

        if (!IsValidTransition(ticket.Status, nextStatus))
        {
            throw new BusinessException("Недопустимый переход статуса по workflow.");
        }

        ticket.Status = nextStatus;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Ticket {TicketId} status changed to {Status} by master {MasterId}",
            ticket.Id,
            ticket.Status,
            currentUserId);

        var updatedTicket = await BuildTicketQuery()
            .AsNoTracking()
            .FirstAsync(item => item.Id == ticket.Id);

        return updatedTicket.ToResponse();
    }

    public async Task<TicketResponse> RejectAsync(
        int id,
        RejectRequest request,
        string currentUserId,
        string currentRole)
    {
        if (!string.Equals(currentRole, "Master", StringComparison.Ordinal))
        {
            throw new ForbiddenException("Только мастер может отклонять заявки.");
        }

        var ticket = await BuildTicketQuery()
            .FirstOrDefaultAsync(item => item.Id == id)
            ?? throw new NotFoundException($"Обращение с идентификатором {id} не найдено.");

        if (ticket.AssigneeId != currentUserId)
        {
            throw new ForbiddenException("Вы можете отклонять только свои заявки.");
        }

        if (ticket.Status == TicketStatus.Closed || ticket.Status == TicketStatus.Rejected)
        {
            throw new BusinessException("Заявка уже находится в финальном статусе.");
        }

        var reason = NormalizeRequiredText(request.Reason, "Причина отклонения");

        ticket.Status = TicketStatus.Rejected;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Ticket {TicketId} rejected by master {MasterId}. Reason: {Reason}",
            ticket.Id,
            currentUserId,
            reason);

        var updatedTicket = await BuildTicketQuery()
            .AsNoTracking()
            .FirstAsync(item => item.Id == ticket.Id);

        return updatedTicket.ToResponse();
    }

    private IQueryable<Ticket> BuildTicketQuery()
    {
        return _db.Tickets
            .Include(ticket => ticket.Category)
            .Include(ticket => ticket.Author)
            .Include(ticket => ticket.Assignee);
    }

    private static TicketStatus? ParseStatus(string? rawStatus)
    {
        if (string.IsNullOrWhiteSpace(rawStatus))
        {
            return null;
        }

        if (!Enum.TryParse<TicketStatus>(rawStatus, true, out var status))
        {
            throw new BusinessException("Некорректное значение фильтра status.");
        }

        return status;
    }

    private static TicketStatus ParseRequiredStatus(string rawStatus)
    {
        var normalized = NormalizeRequiredText(rawStatus, "Статус");

        if (!Enum.TryParse<TicketStatus>(normalized, true, out var status))
        {
            throw new BusinessException("Некорректное значение нового статуса.");
        }

        return status;
    }

    private static bool IsValidTransition(TicketStatus from, TicketStatus to)
    {
        return (from, to) switch
        {
            (TicketStatus.New, TicketStatus.InProgress) => true,
            (TicketStatus.InProgress, TicketStatus.Resolved) => true,
            _ => false
        };
    }

    private static string NormalizeRequiredText(string value, string fieldName)
    {
        var normalized = (value ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new BusinessException($"{fieldName} не может быть пустым.");
        }

        return normalized;
    }
}