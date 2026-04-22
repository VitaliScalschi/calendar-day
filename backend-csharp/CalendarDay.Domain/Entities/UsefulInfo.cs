namespace CalendarDay.Domain.Entities;

public class UsefulInfo
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Type { get; set; } = "page";
    public string Content { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public bool Status { get; set; } = true;
    public int Order { get; set; }
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
