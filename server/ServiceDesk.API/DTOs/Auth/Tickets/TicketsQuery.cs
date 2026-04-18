namespace ServiceDesk.API.DTOs.Tickets;

public sealed class TicketsQuery
{
    public string? Status { get; set; }
    public int? CategoryId { get; set; }
}