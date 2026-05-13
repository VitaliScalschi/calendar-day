using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Users;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Services;

public class UsersService(CalendarDayDbContext db) : IUsersService
{
    private static string NormalizeRole(string role)
    {
        var normalized = role.Trim().ToLowerInvariant();
        return normalized switch
        {
            "admin" or "superadmin" => AppRoles.Admin,
            "editor" => AppRoles.Editor,
            "viewer" => AppRoles.Viewer,
            _ => throw new InvalidOperationException($"Rolul '{role}' nu există."),
        };
    }

    private async Task<Role?> GetRoleEntityAsync(string role, CancellationToken ct)
    {
        var normalized = NormalizeRole(role);
        return await db.Roles.FirstOrDefaultAsync(r => r.Name == normalized, ct);
    }

    private async Task<int> CountAdminsAsync(CancellationToken ct)
    {
        return await db.UserRoles
            .Include(ur => ur.Role)
            .CountAsync(ur => ur.Role.Name == AppRoles.Admin, ct);
    }

    private static string PickPrimaryRole(IEnumerable<string> roles)
    {
        var roleSet = roles.ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (roleSet.Contains(AppRoles.Admin)) return AppRoles.Admin;
        if (roleSet.Contains(AppRoles.Editor)) return AppRoles.Editor;
        return AppRoles.Viewer;
    }

    private static UserDto ToDto(User user)
    {
        var roles = user.UserRoles.Select(ur => ur.Role.Name).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        if (roles.Count == 0) roles.Add(AppRoles.Viewer);
        return new UserDto(
            user.Id,
            user.Email,
            PickPrimaryRole(roles),
            roles,
            user.IsActive,
            user.CreatedAtUtc,
            user.SubdivisionId,
            user.Subdivision?.Name,
            user.Subdivision?.Code);
    }

    private async Task<Guid?> ResolveSubdivisionIdAsync(Guid? subdivisionId, CancellationToken ct)
    {
        if (subdivisionId is null || subdivisionId == Guid.Empty) return null;
        var exists = await db.Subdivisions.AnyAsync(s => s.Id == subdivisionId, ct);
        if (!exists)
        {
            throw new InvalidOperationException("Departamentul selectat nu există.");
        }
        return subdivisionId;
    }

    public async Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken ct)
    {
        var users = await db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Include(u => u.Subdivision)
            .OrderBy(u => u.Email)
            .ToListAsync(ct);
        return users.Select(ToDto).ToList();
    }

    public async Task<UserDto?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var user = await db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Include(u => u.Subdivision)
            .FirstOrDefaultAsync(u => u.Id == id, ct);
        return user is null ? null : ToDto(user);
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto, CancellationToken ct)
    {
        var roleEntity = await GetRoleEntityAsync(dto.Role, ct)
            ?? throw new InvalidOperationException($"Role '{dto.Role}' does not exist.");
        var subdivisionId = await ResolveSubdivisionIdAsync(dto.SubdivisionId, ct);
        var now = DateTime.UtcNow;

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            IsActive = dto.IsActive,
            SubdivisionId = subdivisionId,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            RoleId = roleEntity.Id,
            AssignedAtUtc = now,
        });

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return await GetByIdAsync(user.Id, ct) ?? ToDto(user);
    }

    public async Task<UserDto?> UpdateAsync(Guid id, UpdateUserDto dto, CancellationToken ct)
    {
        var user = await db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Include(u => u.Subdivision)
            .FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return null;

        var roleEntity = await GetRoleEntityAsync(dto.Role, ct)
            ?? throw new InvalidOperationException($"Role '{dto.Role}' does not exist.");
        var subdivisionId = await ResolveSubdivisionIdAsync(dto.SubdivisionId, ct);

        user.Email = dto.Email.Trim().ToLowerInvariant();
        user.IsActive = dto.IsActive;
        user.SubdivisionId = subdivisionId;
        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        }
        user.UserRoles.Clear();
        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            RoleId = roleEntity.Id,
            AssignedAtUtc = DateTime.UtcNow,
        });
        user.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return await GetByIdAsync(user.Id, ct) ?? ToDto(user);
    }

    public async Task<bool> AssignRoleAsync(Guid id, AssignRoleDto dto, Guid? assignedByUserId, CancellationToken ct)
    {
        var user = await db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return false;

        var roleEntity = await GetRoleEntityAsync(dto.Role, ct);
        if (roleEntity is null) return false;

        var exists = user.UserRoles.Any(ur => ur.RoleId == roleEntity.Id);
        if (exists) return true;

        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            RoleId = roleEntity.Id,
            AssignedAtUtc = DateTime.UtcNow,
            AssignedByUserId = assignedByUserId,
        });
        user.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ChangeRoleAsync(Guid id, ChangeUserRoleDto dto, Guid? assignedByUserId, CancellationToken ct)
    {
        var user = await db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return false;

        var fromRole = NormalizeRole(dto.FromRole);
        var toRole = NormalizeRole(dto.ToRole);
        if (fromRole == toRole) return true;

        var fromAssignment = user.UserRoles.FirstOrDefault(ur => ur.Role.Name == fromRole);
        if (fromAssignment is null) return false;
        if (fromRole == AppRoles.Admin && await CountAdminsAsync(ct) <= 1)
        {
            throw new InvalidOperationException("Nu poți schimba rolul ultimului administrator.");
        }

        var toRoleEntity = await GetRoleEntityAsync(toRole, ct);
        if (toRoleEntity is null) return false;

        user.UserRoles.Remove(fromAssignment);
        if (!user.UserRoles.Any(ur => ur.RoleId == toRoleEntity.Id))
        {
            user.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = toRoleEntity.Id,
                AssignedAtUtc = DateTime.UtcNow,
                AssignedByUserId = assignedByUserId,
            });
        }

        user.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> RemoveRoleAsync(Guid id, string role, CancellationToken ct)
    {
        var normalized = NormalizeRole(role);
        var user = await db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return false;

        var assignment = user.UserRoles.FirstOrDefault(ur => ur.Role.Name == normalized);
        if (assignment is null) return false;
        if (normalized == AppRoles.Admin && await CountAdminsAsync(ct) <= 1)
        {
            throw new InvalidOperationException("Nu poți elimina ultimul administrator.");
        }
        if (user.UserRoles.Count <= 1) return false;

        user.UserRoles.Remove(assignment);
        user.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DisableAsync(Guid id, bool isActive, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return false;
        user.IsActive = isActive;
        user.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
    {
        var user = await db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null) return false;
        if (user.UserRoles.Any(ur => ur.Role.Name == AppRoles.Admin) && await CountAdminsAsync(ct) <= 1)
        {
            throw new InvalidOperationException("Nu poți șterge ultimul administrator.");
        }

        user.IsDeleted = true;
        user.IsActive = false;
        user.DeletedAtUtc = DateTime.UtcNow;
        user.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return true;
    }
}
