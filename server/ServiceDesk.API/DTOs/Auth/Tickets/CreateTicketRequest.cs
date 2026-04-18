using System.ComponentModel.DataAnnotations;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.DTOs.Tickets;

public sealed class CreateTicketRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public int CategoryId { get; set; }

    [Required]
    public TicketPriority Priority { get; set; }
}