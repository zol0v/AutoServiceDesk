using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.API.DTOs.Categories;

public class UpdateCategoryRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
}