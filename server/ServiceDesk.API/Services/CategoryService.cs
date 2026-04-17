using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Data;
using ServiceDesk.API.DTOs.Categories;
using ServiceDesk.API.Exceptions;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _db;
    private readonly ILogger<CategoryService> _logger;

    public CategoryService(AppDbContext db, ILogger<CategoryService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<IReadOnlyList<CategoryResponse>> GetAllAsync(bool includeInactive, string role)
    {
        var query = _db.Categories.AsQueryable();
        var isClient = string.Equals(role, "Client", StringComparison.Ordinal);

        if (isClient || !includeInactive)
        {
            if (isClient && includeInactive)
            {
                _logger.LogWarning("Client attempted to request inactive categories. The flag was ignored.");
            }

            query = query.Where(category => category.IsActive);
        }

        var categories = await query
            .OrderBy(category => category.Name)
            .ToListAsync();

        return categories.Select(ToResponse).ToList();
    }

    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest request)
    {
        var name = NormalizeName(request.Name);

        if (await _db.Categories.AnyAsync(category => category.Name == name))
        {
            throw new BusinessException($"Категория '{name}' уже существует.");
        }

        var category = new Category
        {
            Name = name,
            IsActive = true
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Category created: {CategoryName}", category.Name);

        return ToResponse(category);
    }

    public async Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest request)
    {
        var category = await _db.Categories.FindAsync(id)
            ?? throw new NotFoundException($"Категория с идентификатором {id} не найдена.");

        var name = NormalizeName(request.Name);

        if (await _db.Categories.AnyAsync(item => item.Id != id && item.Name == name))
        {
            throw new BusinessException($"Категория '{name}' уже существует.");
        }

        category.Name = name;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Category {CategoryId} renamed to {CategoryName}", category.Id, category.Name);

        return ToResponse(category);
    }

    public async Task<CategoryResponse> SetActiveAsync(int id, SetActiveCategoryRequest request)
    {
        var category = await _db.Categories.FindAsync(id)
            ?? throw new NotFoundException($"Категория с идентификатором {id} не найдена.");

        category.IsActive = request.IsActive;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Category {CategoryId} active state changed to {IsActive}",
            category.Id,
            category.IsActive);

        return ToResponse(category);
    }

    private static CategoryResponse ToResponse(Category category)
    {
        return new CategoryResponse(category.Id, category.Name, category.IsActive);
    }

    private static string NormalizeName(string name)
    {
        var normalized = (name ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new BusinessException("Название категории не может быть пустым.");
        }

        return normalized;
    }
}