using Microsoft.AspNetCore.Identity;
using ServiceDesk.API.DTOs.Auth;
using ServiceDesk.API.Exceptions;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        ITokenService tokenService,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            throw new BusinessException("Пользователь с таким email уже существует.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join(" ", createResult.Errors.Select(e => e.Description));
            throw new BusinessException(errors);
        }

        var roleResult = await _userManager.AddToRoleAsync(user, "Client");
        if (!roleResult.Succeeded)
        {
            var errors = string.Join(" ", roleResult.Errors.Select(e => e.Description));
            throw new BusinessException(errors);
        }

        var token = _tokenService.GenerateToken(user, "Client");

        _logger.LogInformation("User {Email} registered successfully", user.Email);

        return new AuthResponse(token);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            throw new UnauthorizedException("Неверный email или пароль.");
        }

        var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!passwordValid)
        {
            throw new UnauthorizedException("Неверный email или пароль.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "Client";

        var token = _tokenService.GenerateToken(user, role);

        _logger.LogInformation("User {Email} logged in successfully", user.Email);

        return new AuthResponse(token);
    }

    public async Task<MeResponse> GetMeAsync(string userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            throw new UnauthorizedException("Пользователь не найден.");
        }

        return new MeResponse(
            user.Id,
            user.Email ?? string.Empty,
            user.DisplayName,
            role
        );
    }
}