using CalendarDay.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Persistence;

public class CalendarDayDbContext(DbContextOptions<CalendarDayDbContext> options) : DbContext(options)
{
    public DbSet<Election> Elections => Set<Election>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Deadline> Deadlines => Set<Deadline>();
    public DbSet<DeadlineDate> DeadlineDates => Set<DeadlineDate>();
    public DbSet<Regulation> Regulations => Set<Regulation>();
    public DbSet<DeadlineResponsible> DeadlineResponsibles => Set<DeadlineResponsible>();
    public DbSet<DeadlineGroup> DeadlineGroups => Set<DeadlineGroup>();
    public DbSet<ResponsibleOption> ResponsibleOptions => Set<ResponsibleOption>();
    public DbSet<UsefulInfo> UsefulInfos => Set<UsefulInfo>();
    public DbSet<Audience> Audiences => Set<Audience>();
    public DbSet<ElectionType> ElectionTypes => Set<ElectionType>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Election>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).IsRequired().HasMaxLength(250);
            e.Property(x => x.ElectionTypeIds)
                .HasColumnName("election_type_ids")
                .HasColumnType("integer[]");
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
            d.Property(x => x.Type).IsRequired().HasMaxLength(20);
            d.HasOne(x => x.Election)
                .WithMany(e => e.Deadlines)
                .HasForeignKey(x => x.ElectionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DeadlineDate>(d =>
        {
            d.ToTable("deadline_dates");
            d.HasKey(x => x.Id);
            d.Property(x => x.EventDate).IsRequired();
            d.Property(x => x.CreatedAtUtc).HasColumnName("created_at");
            d.HasIndex(x => new { x.DeadlineId, x.EventDate }).IsUnique();
            d.HasOne(x => x.Deadline)
                .WithMany(deadline => deadline.Dates)
                .HasForeignKey(x => x.DeadlineId)
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

        modelBuilder.Entity<UsefulInfo>(u =>
        {
            u.HasKey(x => x.Id);
            u.Property(x => x.Title).IsRequired().HasMaxLength(250);
            u.Property(x => x.Slug).IsRequired().HasMaxLength(500);
            u.Property(x => x.Type).IsRequired().HasMaxLength(50);
            u.Property(x => x.Icon).HasMaxLength(120);
            u.HasIndex(x => x.Order);
        });

        modelBuilder.Entity<Audience>(a =>
        {
            a.ToTable("audiences");
            a.HasKey(x => x.Id);
            a.Property(x => x.Id).HasColumnName("id");
            a.Property(x => x.Key).HasColumnName("key").IsRequired().HasMaxLength(200);
            a.Property(x => x.Name).HasColumnName("name").IsRequired().HasMaxLength(500);
            a.Property(x => x.CreatedAt).HasColumnName("created_at");
            a.HasIndex(x => x.Key).IsUnique();
        });

        modelBuilder.Entity<ElectionType>(t =>
        {
            t.ToTable("election_types");
            t.HasKey(x => x.Id);
            t.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
            t.Property(x => x.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
            t.HasIndex(x => x.Name).IsUnique();
        });
    }
}
