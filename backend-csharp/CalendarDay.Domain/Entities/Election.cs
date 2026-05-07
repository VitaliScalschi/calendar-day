namespace CalendarDay.Domain.Entities;

public class Election
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateOnly Eday { get; set; }
    public List<int> ElectionTypeIds { get; set; } = [];
    public string? DocumentOriginalName { get; set; }
    public string? DocumentStoredName { get; set; }
    public string? DocumentContentType { get; set; }
    public long? DocumentSizeBytes { get; set; }
    public DateTime? DocumentUploadedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<Deadline> Deadlines { get; set; } = new List<Deadline>();
}
