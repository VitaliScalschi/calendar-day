using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Seed;

public class DefaultUsersSeedService(CalendarDayDbContext db)
{
    public async Task EnsureDefaultUsersAsync(CancellationToken ct = default)
    {
        foreach (var roleName in AppRoles.All)
        {
            if (!await db.Roles.AnyAsync(x => x.Name == roleName, ct))
            {
                db.Roles.Add(new Role
                {
                    Id = Guid.NewGuid(),
                    Name = roleName,
                    Description = roleName switch
                    {
                        AppRoles.Admin => "Acces complet la administrare.",
                        AppRoles.Editor => "Poate modifica conținut.",
                        _ => "Doar vizualizare."
                    },
                    CreatedAtUtc = DateTime.UtcNow,
                });
            }
        }
        await db.SaveChangesAsync(ct);

        var adminEmail = "admin@cec.md";
        var admin = await db.Users
            .Include(x => x.UserRoles)
            .FirstOrDefaultAsync(x => x.Email == adminEmail, ct);
        if (admin is null)
        {
            var now = DateTime.UtcNow;
            db.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Email = adminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                IsActive = true,
                IsDeleted = false,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            });
            await db.SaveChangesAsync(ct);
            admin = await db.Users.Include(x => x.UserRoles).FirstOrDefaultAsync(x => x.Email == adminEmail, ct);
        }

        var adminRole = await db.Roles.FirstAsync(x => x.Name == AppRoles.Admin, ct);
        if (admin is not null && !await db.UserRoles.AnyAsync(x => x.UserId == admin.Id && x.RoleId == adminRole.Id, ct))
        {
            db.UserRoles.Add(new UserRole
            {
                UserId = admin.Id,
                RoleId = adminRole.Id,
                AssignedAtUtc = DateTime.UtcNow,
            });
            await db.SaveChangesAsync(ct);
        }
    }
}
