using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.API.DTOs.Common;
using ServiceDesk.API.DTOs.Tickets;
using ServiceDesk.API.Services;

namespace ServiceDesk.API.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
[Produces("application/json")]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<TicketResponse>> Create([FromBody] CreateTicketRequest request)
    {
        var result = await _ticketService.CreateAsync(request, GetCurrentUserId(), GetCurrentRole());
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<TicketResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResponse<TicketResponse>>> GetList([FromQuery] TicketsQuery query)
    {
        var result = await _ticketService.GetListAsync(query, GetCurrentUserId(), GetCurrentRole());
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TicketResponse>> GetById(int id)
    {
        var result = await _ticketService.GetByIdAsync(id, GetCurrentUserId(), GetCurrentRole());
        return Ok(result);
    }

    [HttpPost("{id:int}/assign")]
    [Authorize(Roles = "Master")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<TicketResponse>> AssignToMe(int id)
    {
        var result = await _ticketService.AssignToMeAsync(id, GetCurrentUserId(), GetCurrentRole());
        return Ok(result);
    }

    [HttpPost("{id:int}/status")]
    [Authorize(Roles = "Master")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TicketResponse>> ChangeStatus(int id, [FromBody] ChangeStatusRequest request)
    {
        var result = await _ticketService.ChangeStatusAsync(request: request, id: id, currentUserId: GetCurrentUserId(), currentRole: GetCurrentRole());
        return Ok(result);
    }

    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = "Master")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TicketResponse>> Reject(int id, [FromBody] RejectRequest request)
    {
        var result = await _ticketService.RejectAsync(request: request, id: id, currentUserId: GetCurrentUserId(), currentRole: GetCurrentRole());
        return Ok(result);
    }

    private string GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new InvalidOperationException("User ID claim is missing.");
    }

    private string GetCurrentRole()
    {
        return User.FindFirstValue("role")
            ?? User.FindFirstValue(ClaimTypes.Role)
            ?? string.Empty;
    }
}