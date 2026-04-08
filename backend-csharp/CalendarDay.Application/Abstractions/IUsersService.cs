using CalendarDay.Application.Contracts.Users;

namespace CalendarDay.Application.Abstractions;

public interface IUsersService
{
    Task<IReadOnlyList<UserDto>> GetAllAsync(CancellationToken ct);
    Task<UserDto> CreateAsync(CreateUserDto dto, CancellationToken ct);
    Task<UserDto?> UpdateAsync(Guid id, UpdateUserDto dto, CancellationToken ct);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
