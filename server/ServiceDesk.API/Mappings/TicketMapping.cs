using ServiceDesk.API.DTOs.Tickets;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Mappings;

public static class TicketMapping
{
    public static UserBriefResponse ToBriefResponse(this ApplicationUser user)
    {
        return new UserBriefResponse
        {
            Id = user.Id,
            DisplayName = user.DisplayName,
            Email = user.Email ?? string.Empty
        };
    }

    public static TicketResponse ToResponse(this Ticket ticket)
    {
        return new TicketResponse
        {
            Id = ticket.Id,
            Title = ticket.Title,
            Description = ticket.Description,
            Status = ticket.Status.ToString(),
            Priority = ticket.Priority.ToString(),
            CreatedAt = ticket.CreatedAt,
            CategoryId = ticket.CategoryId,
            CategoryName = ticket.Category.Name,
            Author = ticket.Author.ToBriefResponse(),
            Assignee = ticket.Assignee is null ? null : ticket.Assignee.ToBriefResponse()
        };
    }
}