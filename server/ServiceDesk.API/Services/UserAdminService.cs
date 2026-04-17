using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.DTOs.Users;
using ServiceDesk.API.Exceptions;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Services;

public class UserAdminService : IUserAdminService
{
    private static readonly string[] AllowedRoles = ["Client", "Master", "Admin"];

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<UserAdminService> _logger;

    public UserAdminService(
        UserManager<ApplicationUser> userManager,
        ILogger<UserAdminService> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<IReadOnlyList<UserResponse>> GetAllAsync()
    {
        var users = await _userManager.Users
            .OrderBy(user => user.DisplayName)
            .ThenBy(user => user.Email)
            .ToListAsync();

        var result = new List<UserResponse>(users.Count);

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Client";
            result.Add(ToResponse(user, role));
        }

        return result;
    }

    public async Task<UserResponse> UpdateRoleAsync(string userId, UpdateUserRoleRequest request)
    {
        var requestedRole = (request.Role ?? string.Empty).Trim();

        if (!AllowedRoles.Contains(requestedRole, StringComparer.Ordinal))
        {
            throw new BusinessException("Допустимые роли: Client, Master, Admin.");
        }

        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new NotFoundException("Пользователь не найден.");

        var currentRoles = await _userManager.GetRolesAsync(user);

        if (currentRoles.Count == 1 && string.Equals(currentRoles[0], requestedRole, StringComparison.Ordinal))
        {
            return ToResponse(user, requestedRole);
        }

        if (currentRoles.Count > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
            {
                throw new BusinessException(FormatErrors(removeResult));
            }
        }

        var addResult = await _userManager.AddToRoleAsync(user, requestedRole);
        if (!addResult.Succeeded)
        {
            throw new BusinessException(FormatErrors(addResult));
        }

        _logger.LogInformation(
            "User {UserId} role updated from {OldRoles} to {NewRole}",
            user.Id,
            string.Join(", ", currentRoles),
            requestedRole);

        return ToResponse(user, requestedRole);
    }

    private static UserResponse ToResponse(ApplicationUser user, string role)
    {
        return new UserResponse(user.Id, user.DisplayName, user.Email ?? string.Empty, role);
    }

    private static string FormatErrors(IdentityResult result)
    {
        return string.Join(" ", result.Errors.Select(error => error.Description));
    }
}