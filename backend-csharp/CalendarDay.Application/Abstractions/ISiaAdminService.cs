using CalendarDay.Application.Contracts.SiaAdmin;

namespace CalendarDay.Application.Abstractions;

public interface ISiaAdminService
{
    Task<SiaSessionInfoDto?> LoginAsync(SiaLoginRequestDto request, CancellationToken ct);
    Task<SiaSessionInfoDto?> GetSessionInfoAsync(string sessionToken, CancellationToken ct);
    Task<bool> IsValidTokenAsync(string sessionToken, CancellationToken ct);
    Task LogoutAsync(string sessionToken, CancellationToken ct);
}
