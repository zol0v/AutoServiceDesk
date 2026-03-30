using Microsoft.AspNetCore.Identity;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Data;

public static class DbInitializer
{
    private record SeedUser(string Email, string Password, string DisplayName, string Role);

    private static readonly SeedUser[] Users =
    [
        new("admin@demo.com", "Admin123!", "Admin", "Admin"),
        new("operator1@demo.com", "Operator123!", "Operator One", "Operator"),
        new("operator2@demo.com", "Operator123!", "Operator Two", "Operator"),
        new("client1@demo.com", "Client123!", "Client One", "Client"),
        new("client2@demo.com", "Client123!", "Client Two", "Client"),
        new("client3@demo.com", "Client123!", "Client Three", "Client")
    ];

    public static async Task SeedAsync(IServiceProvider services)
    {
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var logger = services.GetRequiredService<ILogger<AppDbContext>>();

        foreach (var seed in Users)
        {
            var existingUser = await userManager.FindByEmailAsync(seed.Email);
            if (existingUser is not null)
            {
                continue;
            }

            var user = new ApplicationUser
            {
                UserName = seed.Email,
                Email = seed.Email,
                DisplayName = seed.DisplayName
            };

            var createResult = await userManager.CreateAsync(user, seed.Password);
            if (!createResult.Succeeded)
            {
                var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                logger.LogError("Failed to create seed user {Email}: {Errors}", seed.Email, errors);
                continue;
            }

            var roleResult = await userManager.AddToRoleAsync(user, seed.Role);
            if (!roleResult.Succeeded)
            {
                var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
                logger.LogError("Failed to assign role {Role} to {Email}: {Errors}", seed.Role, seed.Email, errors);
                continue;
            }

            logger.LogInformation("Seeded user {Email} with role {Role}", seed.Email, seed.Role);
        }
    }
}