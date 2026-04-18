using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.API.Models;

public class Ticket
{
    public int Id { get; set; }

    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public TicketStatus Status { get; set; } = TicketStatus.New;

    public TicketPriority Priority { get; set; } = TicketPriority.Medium;

    public int CategoryId { get; set; }
    public Category Category { get; set; } = default!;

    public string AuthorId { get; set; } = string.Empty;
    public ApplicationUser Author { get; set; } = default!;

    public string? AssigneeId { get; set; }
    public ApplicationUser? Assignee { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}