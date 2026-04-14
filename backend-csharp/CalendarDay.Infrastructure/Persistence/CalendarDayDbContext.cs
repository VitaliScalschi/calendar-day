using CalendarDay.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Persistence;

public class CalendarDayDbContext(DbContextOptions<CalendarDayDbContext> options) : DbContext(options)
{
    public DbSet<Election> Elections => Set<Election>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Deadline> Deadlines => Set<Deadline>();
    public DbSet<Regulation> Regulations => Set<Regulation>();
    public DbSet<DeadlineResponsible> DeadlineResponsibles => Set<DeadlineResponsible>();
    public DbSet<DeadlineGroup> DeadlineGroups => Set<DeadlineGroup>();
    public DbSet<ResponsibleOption> ResponsibleOptions => Set<ResponsibleOption>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Election>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).IsRequired().HasMaxLength(250);
        });

        modelBuilder.Entity<User>(u =>
        {
            u.HasKey(x => x.Id);
            u.Property(x => x.Email).IsRequired().HasMaxLength(320);
            u.Property(x => x.PasswordHash).IsRequired();
            u.HasIndex(x => x.Email).IsUnique();
        });

        modelBuilder.Entity<Deadline>(d =>
        {
            d.HasKey(x => x.Id);
            d.Property(x => x.Title).IsRequired().HasMaxLength(350);
            d.Property(x => x.Description).IsRequired();
            d.HasOne(x => x.Election)
                .WithMany(e => e.Deadlines)
                .HasForeignKey(x => x.ElectionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Regulation>(r =>
        {
            r.HasKey(x => x.Id);
            r.Property(x => x.Title).IsRequired().HasMaxLength(350);
            r.HasOne(x => x.Deadline)
                .WithMany(d => d.Regulations)
                .HasForeignKey(x => x.DeadlineId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DeadlineResponsible>(r =>
        {
            r.HasKey(x => x.Id);
            r.Property(x => x.Value).IsRequired().HasMaxLength(200);
            r.HasOne(x => x.Deadline)
                .WithMany(d => d.Responsibles)
                .HasForeignKey(x => x.DeadlineId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DeadlineGroup>(g =>
        {
            g.HasKey(x => x.Id);
            g.Property(x => x.Value).IsRequired().HasMaxLength(100);
            g.HasOne(x => x.Deadline)
                .WithMany(d => d.Groups)
                .HasForeignKey(x => x.DeadlineId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ResponsibleOption>(r =>
        {
            r.HasKey(x => x.Id);
            r.Property(x => x.Label).IsRequired().HasMaxLength(250);
            r.HasIndex(x => x.Label).IsUnique();
        });
    }
}
