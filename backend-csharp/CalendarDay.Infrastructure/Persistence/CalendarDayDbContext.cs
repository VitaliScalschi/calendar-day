using CalendarDay.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Persistence;

public class CalendarDayDbContext(DbContextOptions<CalendarDayDbContext> options) : DbContext(options)
{
    public DbSet<Election> Elections => Set<Election>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Deadline> Deadlines => Set<Deadline>();
    public DbSet<DeadlineDate> DeadlineDates => Set<DeadlineDate>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<Regulation> Regulations => Set<Regulation>();
    public DbSet<DeadlineResponsible> DeadlineResponsibles => Set<DeadlineResponsible>();
    public DbSet<DeadlineGroup> DeadlineGroups => Set<DeadlineGroup>();
    public DbSet<ResponsibleOption> ResponsibleOptions => Set<ResponsibleOption>();
    public DbSet<UsefulInfo> UsefulInfos => Set<UsefulInfo>();
    public DbSet<Audience> Audiences => Set<Audience>();
    public DbSet<ElectionType> ElectionTypes => Set<ElectionType>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Subdivision> Subdivisions => Set<Subdivision>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Election>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).IsRequired().HasMaxLength(250);
            e.Property(x => x.ElectionTypeIds)
                .HasColumnName("election_type_ids")
                .HasColumnType("integer[]");
            e.Property(x => x.DocumentOriginalName).HasMaxLength(500);
            e.Property(x => x.DocumentStoredName).HasMaxLength(500);
            e.Property(x => x.DocumentContentType).HasMaxLength(200);
        });

        modelBuilder.Entity<User>(u =>
        {
            u.HasKey(x => x.Id);
            u.Property(x => x.Email).IsRequired().HasMaxLength(320);
            u.Property(x => x.PasswordHash).IsRequired();
            u.Property(x => x.SubdivisionId).HasColumnName("subdivision_id");
            u.HasIndex(x => x.Email).IsUnique();
            u.HasIndex(x => new { x.IsDeleted, x.IsActive });
            u.HasIndex(x => x.SubdivisionId);
            u.HasOne(x => x.Subdivision)
                .WithMany()
                .HasForeignKey(x => x.SubdivisionId)
                .OnDelete(DeleteBehavior.SetNull);
            u.HasQueryFilter(x => !x.IsDeleted);
        });

        modelBuilder.Entity<Role>(r =>
        {
            r.ToTable("roles");
            r.HasKey(x => x.Id);
            r.Property(x => x.Id).HasColumnName("id");
            r.Property(x => x.Name).HasColumnName("name");
            r.Property(x => x.Description).HasColumnName("description");
            r.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
            r.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");
            r.Property(x => x.Name).IsRequired().HasMaxLength(50);
            r.Property(x => x.Description).HasMaxLength(200);
            r.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<UserRole>(ur =>
        {
            ur.ToTable("user_roles");
            ur.HasKey(x => new { x.UserId, x.RoleId });
            ur.Property(x => x.UserId).HasColumnName("user_id");
            ur.Property(x => x.RoleId).HasColumnName("role_id");
            ur.Property(x => x.AssignedAtUtc).HasColumnName("assigned_at_utc");
            ur.Property(x => x.AssignedByUserId).HasColumnName("assigned_by_user_id");
            ur.HasIndex(x => x.RoleId);
            ur.HasOne(x => x.User)
                .WithMany(x => x.UserRoles)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            ur.HasOne(x => x.Role)
                .WithMany(x => x.UserRoles)
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
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

        modelBuilder.Entity<Document>(d =>
        {
            d.ToTable("documents");
            d.HasKey(x => x.Id);
            d.Property(x => x.OriginalName).IsRequired().HasMaxLength(500);
            d.Property(x => x.StoredName).IsRequired().HasMaxLength(500);
            d.Property(x => x.RelativeUrl).IsRequired().HasMaxLength(1000);
            d.Property(x => x.ContentType).IsRequired().HasMaxLength(200);
            d.Property(x => x.SizeBytes).IsRequired();
            d.Property(x => x.CreatedAtUtc).IsRequired();
        });

        modelBuilder.Entity<Regulation>(r =>
        {
            r.HasKey(x => x.Id);
            r.Property(x => x.Title).IsRequired().HasMaxLength(350);
            r.HasOne(x => x.Deadline)
                .WithMany(d => d.Regulations)
                .HasForeignKey(x => x.DeadlineId)
                .OnDelete(DeleteBehavior.Cascade);
            r.HasOne(x => x.Document)
                .WithMany(d => d.Regulations)
                .HasForeignKey(x => x.DocumentId)
                .OnDelete(DeleteBehavior.SetNull);
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
            r.Property(x => x.DisplayOrder).HasColumnName("display_order");
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
            a.Property(x => x.DisplayOrder).HasColumnName("display_order");
            a.Property(x => x.CreatedAt).HasColumnName("created_at");
            a.HasIndex(x => x.Key).IsUnique();
        });

        modelBuilder.Entity<ElectionType>(t =>
        {
            t.ToTable("election_types");
            t.HasKey(x => x.Id);
            t.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
            t.Property(x => x.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
            t.Property(x => x.DisplayOrder).HasColumnName("display_order");
            t.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<AuditLog>(a =>
        {
            a.ToTable("audit_logs");
            a.HasKey(x => x.Id);
            a.Property(x => x.Id).HasColumnName("id");
            a.Property(x => x.Username).HasColumnName("username").HasMaxLength(320);
            a.Property(x => x.Action).HasColumnName("action").IsRequired().HasMaxLength(120);
            a.Property(x => x.Details).HasColumnName("details").HasMaxLength(4000);
            a.Property(x => x.Endpoint).HasColumnName("endpoint").IsRequired().HasMaxLength(1000);
            a.Property(x => x.Method).HasColumnName("method").IsRequired().HasMaxLength(16);
            a.Property(x => x.StatusCode).HasColumnName("status_code");
            a.Property(x => x.IpAddress).HasColumnName("ip_address").HasMaxLength(64);
            a.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
            a.HasIndex(x => x.CreatedAtUtc);
            a.HasIndex(x => x.Username);
            a.HasIndex(x => x.StatusCode);
        });

        modelBuilder.Entity<Subdivision>(s =>
        {
            s.ToTable("subdivisions");
            s.HasKey(x => x.Id);
            s.Property(x => x.Id).HasColumnName("id");
            s.Property(x => x.Name).HasColumnName("name").IsRequired().HasMaxLength(250);
            s.Property(x => x.Code).HasColumnName("code").IsRequired().HasMaxLength(50);
            s.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            s.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
            s.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");
            s.HasIndex(x => x.Code).IsUnique();
            s.HasIndex(x => x.Name);
        });
    }
}
