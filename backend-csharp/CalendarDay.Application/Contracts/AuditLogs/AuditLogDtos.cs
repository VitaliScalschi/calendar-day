using CalendarDay.Application.Contracts;

namespace CalendarDay.Application.Contracts.AuditLogs;

public record AuditLogDto(
    Guid Id,
    string? Username,
    string Action,
    string? Details,
    string Endpoint,
    string Method,
    int StatusCode,
    string? IpAddress,
    DateTime CreatedAtUtc
);

public class AuditLogQuery
{
    public string? Search { get; set; }
    public string? User { get; set; }
    public string? Action { get; set; }
    public string? Endpoint { get; set; }
    public DateTime? FromUtc { get; set; }
    public DateTime? ToUtc { get; set; }
    public int? StatusCode { get; set; }
    public string SortBy { get; set; } = "timestamp";
    public string SortDir { get; set; } = "desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public record AuditLogListResponse(
    PagedResult<AuditLogDto> Data
);
