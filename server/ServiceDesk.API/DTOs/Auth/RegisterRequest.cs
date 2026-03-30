using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.API.DTOs.Auth;

public record RegisterRequest(
    [Required, MinLength(2)] string DisplayName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password
);