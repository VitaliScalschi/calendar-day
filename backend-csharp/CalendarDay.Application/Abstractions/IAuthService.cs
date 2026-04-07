using CalendarDay.Application.Contracts.Auth;

namespace CalendarDay.Application.Abstractions;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto, CancellationToken ct);
}
