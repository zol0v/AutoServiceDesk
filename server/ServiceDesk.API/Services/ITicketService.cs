using ServiceDesk.API.DTOs.Common;
using ServiceDesk.API.DTOs.Tickets;

namespace ServiceDesk.API.Services;

public interface ITicketService
{
    Task<TicketResponse> CreateAsync(CreateTicketRequest request, string currentUserId, string currentRole);
    Task<PagedResponse<TicketResponse>> GetListAsync(TicketsQuery query, string currentUserId, string currentRole);
    Task<TicketResponse> GetByIdAsync(int id, string currentUserId, string currentRole);
}