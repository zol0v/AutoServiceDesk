using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Ticket> Tickets => Set<Ticket>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Category>(entity =>
        {
            entity.HasKey(category => category.Id);

            entity.Property(category => category.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.HasIndex(category => category.Name)
                .IsUnique();
        });

        builder.Entity<Ticket>(entity =>
        {
            entity.HasKey(ticket => ticket.Id);

            entity.Property(ticket => ticket.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(ticket => ticket.Description)
                .IsRequired()
                .HasMaxLength(2000);

            entity.HasOne(ticket => ticket.Category)
                .WithMany()
                .HasForeignKey(ticket => ticket.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(ticket => ticket.Author)
                .WithMany()
                .HasForeignKey(ticket => ticket.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(ticket => ticket.Assignee)
                .WithMany()
                .HasForeignKey(ticket => ticket.AssigneeId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}