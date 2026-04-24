using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Data;

public static class DbInitializer
{
    private record SeedUser(string Email, string Password, string DisplayName, string Role);

    private record SeedTicket(
        string Title,
        string Description,
        TicketPriority Priority,
        TicketStatus Status,
        string CategoryName,
        string AuthorEmail,
        string? AssigneeEmail,
        int CreatedDaysAgo);

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

    private static readonly SeedTicket[] Tickets =
    [
        new(
            "Запись на диагностику двигателя",
            "Автомобиль начал троить на холодную, нужен первичный осмотр и компьютерная диагностика.",
            TicketPriority.High,
            TicketStatus.New,
            "Диагностика двигателя",
            "client1@demo.com",
            null,
            1),

        new(
            "Стук в подвеске на неровностях",
            "При проезде лежачих полицейских слышен сильный стук спереди. Нужна проверка ходовой части.",
            TicketPriority.High,
            TicketStatus.InProgress,
            "Подвеска и ходовая",
            "client1@demo.com",
            "master1@demo.com",
            3),

        new(
            "Плановое ТО перед поездкой",
            "Нужно заменить масло, фильтры и провести стандартную проверку автомобиля перед дальней поездкой.",
            TicketPriority.Medium,
            TicketStatus.Resolved,
            "Плановое ТО",
            "client2@demo.com",
            "master2@demo.com",
            7),

        new(
            "Проверка тормозной системы",
            "Педаль тормоза стала мягче, чем обычно. Нужна диагностика тормозов.",
            TicketPriority.High,
            TicketStatus.New,
            "Тормозная система",
            "client3@demo.com",
            null,
            2),

        new(
            "Проблема с электрикой салона",
            "Периодически пропадает подсветка панели приборов и не работает прикуриватель.",
            TicketPriority.Medium,
            TicketStatus.InProgress,
            "Электрика",
            "client2@demo.com",
            "master1@demo.com",
            4),

        new(
            "Клиент отказался от кузовного ремонта",
            "После оценки стоимости ремонта клиент решил отказаться от работ.",
            TicketPriority.Low,
            TicketStatus.Rejected,
            "Диагностика двигателя",
            "client3@demo.com",
            "master2@demo.com",
            9)
    ];

    public static async Task SeedAsync(IServiceProvider services)
    {
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var db = services.GetRequiredService<AppDbContext>();
        var logger = services.GetRequiredService<ILogger<AppDbContext>>();

        await SeedUsersAsync(userManager, logger);
        await SeedCategoriesAsync(db, logger);
        await SeedTicketsAsync(db, logger);
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
            var existingCategory = await db.Categories.FirstOrDefaultAsync(category => category.Name == name);
            if (existingCategory is null)
            {
                db.Categories.Add(new Category
                {
                    Name = name,
                    IsActive = isActive
                });

                logger.LogInformation("Seeded category {CategoryName} with active={IsActive}", name, isActive);
                continue;
            }

            if (existingCategory.IsActive != isActive)
            {
                existingCategory.IsActive = isActive;
                logger.LogInformation("Updated category {CategoryName} active={IsActive}", name, isActive);
            }
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedTicketsAsync(AppDbContext db, ILogger logger)
    {
        var categoryIds = await db.Categories
            .ToDictionaryAsync(category => category.Name, category => category.Id);

        var userIds = await db.Users
            .ToDictionaryAsync(user => user.Email ?? string.Empty, user => user.Id);

        foreach (var seed in Tickets)
        {
            if (!categoryIds.TryGetValue(seed.CategoryName, out var categoryId))
            {
                logger.LogWarning(
                    "Category {CategoryName} was not found for seed ticket {Title}",
                    seed.CategoryName,
                    seed.Title);
                continue;
            }

            if (!userIds.TryGetValue(seed.AuthorEmail, out var authorId))
            {
                logger.LogWarning(
                    "Author {AuthorEmail} was not found for seed ticket {Title}",
                    seed.AuthorEmail,
                    seed.Title);
                continue;
            }

            string? assigneeId = null;
            if (!string.IsNullOrWhiteSpace(seed.AssigneeEmail))
            {
                if (!userIds.TryGetValue(seed.AssigneeEmail, out assigneeId))
                {
                    logger.LogWarning(
                        "Assignee {AssigneeEmail} was not found for seed ticket {Title}",
                        seed.AssigneeEmail,
                        seed.Title);
                    continue;
                }
            }

            var existingTicket = await db.Tickets.FirstOrDefaultAsync(ticket => ticket.Title == seed.Title);

            if (existingTicket is null)
            {
                db.Tickets.Add(new Ticket
                {
                    Title = seed.Title,
                    Description = seed.Description,
                    Priority = seed.Priority,
                    Status = seed.Status,
                    CategoryId = categoryId,
                    AuthorId = authorId,
                    AssigneeId = assigneeId,
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-seed.CreatedDaysAgo)
                });

                continue;
            }

            existingTicket.Description = seed.Description;
            existingTicket.Priority = seed.Priority;
            existingTicket.Status = seed.Status;
            existingTicket.CategoryId = categoryId;
            existingTicket.AuthorId = authorId;
            existingTicket.AssigneeId = assigneeId;
            existingTicket.CreatedAt = DateTimeOffset.UtcNow.AddDays(-seed.CreatedDaysAgo);
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Seeded demo tickets for Lab 6");
    }
}