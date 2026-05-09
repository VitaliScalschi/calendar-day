using CalendarDay.Application.Contracts;
using CalendarDay.Application.Contracts.AuditLogs;

namespace CalendarDay.Application.Abstractions;

public interface IAuditLogsService
{
    Task<PagedResult<AuditLogDto>> GetAsync(AuditLogQuery query, CancellationToken ct);
    Task LogAsync(string? username, string action, string? details, string endpoint, string method, int statusCode, string? ipAddress, CancellationToken ct);
}
