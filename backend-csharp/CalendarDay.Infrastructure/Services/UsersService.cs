using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Users;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Services;

public class UsersService(CalendarDayDbContext db) : IUsersService
{
    public async Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken ct)
    {
        return await db.Users
            .OrderBy(u => u.Email)
            .Select(u => new UserDto(u.Id, u.Email, u.Role.ToString(), u.IsActive, u.CreatedAtUtc))
            .ToListAsync(ct);
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto, CancellationToken ct)
    {
        var roleParsed = Enum.TryParse<UserRole>(dto.Role, true, out var parsedRole) ? parsedRole : UserRole.Viewer;
        var now = DateTime.UtcNow;

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = roleParsed,
            IsActive = dto.IsActive,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return new UserDto(user.Id, user.Email, user.Role.ToString(), user.IsActive, user.CreatedAtUtc);
    }

    public async Task<UserDto?> UpdateAsync(Guid id, UpdateUserDto dto, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return null;

        user.Email = dto.Email.Trim().ToLowerInvariant();
        user.Role = Enum.TryParse<UserRole>(dto.Role, true, out var parsedRole) ? parsedRole : UserRole.Viewer;
        user.IsActive = dto.IsActive;
        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        }
        user.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return new UserDto(user.Id, user.Email, user.Role.ToString(), user.IsActive, user.CreatedAtUtc);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return false;

        db.Users.Remove(user);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
