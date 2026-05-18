using CalendarDay.Application.Contracts.Auth;

namespace CalendarDay.Application.Abstractions;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto, CancellationToken ct);
    Task<LoginResponseDto?> ExchangeSiaSessionAsync(string sessionToken, CancellationToken ct);
    Task<ForgotPasswordResponseDto> RequestPasswordResetAsync(
        ForgotPasswordRequestDto dto,
        string? clientIp,
        CancellationToken ct);
    Task<ResetPasswordResponseDto> ResetPasswordAsync(ResetPasswordRequestDto dto, CancellationToken ct);
}
