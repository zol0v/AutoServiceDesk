using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Data;

public static class DbInitializer
{
    private record SeedUser(string Email, string Password, string DisplayName, string Role);

    private static readonly SeedUser[] Users =
    [
        new("admin@demo.com", "Admin123!", "Администратор", "Admin"),
        new("master1@demo.com", "Master123!", "Мастер Илья", "Master"),
        new("master2@demo.com", "Master123!", "Мастер Антон", "Master"),
        new("client1@demo.com", "Client123!", "Клиент Иван", "Client"),
        new("client2@demo.com", "Client123!", "Клиент Олег", "Client"),
        new("client3@demo.com", "Client123!", "Клиент Мария", "Client")
    ];

    private static readonly (string Name, bool IsActive)[] Categories =
    [
        ("Диагностика двигателя", true),
        ("Плановое ТО", true),
        ("Подвеска и ходовая", true),
        ("Тормозная система", true),
        ("Электрика", true),
        ("Кузовной ремонт", false)
    ];

    public static async Task SeedAsync(IServiceProvider services)
    {
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var db = services.GetRequiredService<AppDbContext>();
        var logger = services.GetRequiredService<ILogger<AppDbContext>>();

        await SeedUsersAsync(userManager, logger);
        await SeedCategoriesAsync(db, logger);
    }

    private static async Task SeedUsersAsync(
        UserManager<ApplicationUser> userManager,
        ILogger logger)
    {
        foreach (var seed in Users)
        {
            var existingUser = await userManager.FindByEmailAsync(seed.Email);
            if (existingUser is null)
                {
                    existingUser = new ApplicationUser
                    {
                        UserName = seed.Email,
                        Email = seed.Email,
                        DisplayName = seed.DisplayName
                    };

                var createResult = await userManager.CreateAsync(existingUser, seed.Password);
                if (!createResult.Succeeded)
                    {
                        var errors = string.Join(", ", createResult.Errors.Select(error => error.Description));
                        logger.LogError("Failed to create seed user {Email}: {Errors}", seed.Email, errors);
                        continue;
                    }
                }
            else
            {
                var needsUpdate =
                    existingUser.UserName != seed.Email ||
                    existingUser.Email != seed.Email ||
                    existingUser.DisplayName != seed.DisplayName;

                if (needsUpdate)
                {
                    existingUser.UserName = seed.Email;
                    existingUser.Email = seed.Email;
                    existingUser.DisplayName = seed.DisplayName;

                    var updateResult = await userManager.UpdateAsync(existingUser);
                    if (!updateResult.Succeeded)
                    {
                        var errors = string.Join(", ", updateResult.Errors.Select(error => error.Description));
                        logger.LogError("Failed to update seed user {Email}: {Errors}", seed.Email, errors);
                        continue;
                    }
                }
            }
            var currentRoles = await userManager.GetRolesAsync(existingUser);
            if (currentRoles.Count > 0)
            {
                var removeResult = await userManager.RemoveFromRolesAsync(existingUser, currentRoles);
                if (!removeResult.Succeeded)
                {
                    var errors = string.Join(", ", removeResult.Errors.Select(error => error.Description));
                    logger.LogError("Failed to remove roles from {Email}: {Errors}", seed.Email, errors);
                    continue;
                }
            }

            var addResult = await userManager.AddToRoleAsync(existingUser, seed.Role);
            if (!addResult.Succeeded)
            {
                var errors = string.Join(", ", addResult.Errors.Select(error => error.Description));
                logger.LogError("Failed to assign role {Role} to {Email}: {Errors}", seed.Role, seed.Email, errors);
                continue;
            }

            logger.LogInformation("Seeded user {Email} with role {Role}", seed.Email, seed.Role);
        }
    }

    private static async Task SeedCategoriesAsync(AppDbContext db, ILogger logger)
    {
        foreach (var (name, isActive) in Categories)
        {
            var exists = await db.Categories.AnyAsync(category => category.Name == name);
            if (exists)
            {
                continue;
            }

            db.Categories.Add(new Category
            {
                Name = name,
                IsActive = isActive
            });

            logger.LogInformation("Seeded category {CategoryName} with active={IsActive}", name, isActive);
        }

        await db.SaveChangesAsync();
    }
}