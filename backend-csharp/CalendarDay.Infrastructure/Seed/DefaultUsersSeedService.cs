using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Seed;

public class DefaultUsersSeedService(CalendarDayDbContext db)
{
    public async Task EnsureDefaultUsersAsync(CancellationToken ct = default)
    {
        var adminEmail = "admin@cec.md";
        var admin = await db.Users.FirstOrDefaultAsync(x => x.Email == adminEmail, ct);
        if (admin is null)
        {
            db.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Email = adminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Role = UserRole.SuperAdmin,
                IsActive = true
            });
            await db.SaveChangesAsync(ct);
        }
    }
}
