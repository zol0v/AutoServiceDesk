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
        var status = ParseStatus(query.Status);

        var ticketsQuery = BuildTicketQuery()
            .AsNoTracking()
            .AsQueryable();

        if (string.Equals(currentRole, "Client", StringComparison.Ordinal))
        {
            ticketsQuery = ticketsQuery.Where(ticket => ticket.AuthorId == currentUserId);
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

        return ticket.ToResponse();
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