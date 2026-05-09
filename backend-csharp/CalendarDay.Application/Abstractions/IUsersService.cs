using CalendarDay.Application.Contracts.Users;

namespace CalendarDay.Application.Abstractions;

public interface IUsersService
{
    Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken ct);
    Task<UserDto?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<UserDto> CreateAsync(CreateUserDto dto, CancellationToken ct);
    Task<UserDto?> UpdateAsync(Guid id, UpdateUserDto dto, CancellationToken ct);
    Task<bool> AssignRoleAsync(Guid id, AssignRoleDto dto, Guid? assignedByUserId, CancellationToken ct);
    Task<bool> ChangeRoleAsync(Guid id, ChangeUserRoleDto dto, Guid? assignedByUserId, CancellationToken ct);
    Task<bool> RemoveRoleAsync(Guid id, string role, CancellationToken ct);
    Task<bool> DisableAsync(Guid id, bool isActive, CancellationToken ct);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
