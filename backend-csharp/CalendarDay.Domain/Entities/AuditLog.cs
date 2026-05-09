namespace CalendarDay.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; }
    public string? Username { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string Endpoint { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
