namespace CalendarDay.Domain.Entities;

public class Deadline
{
    public const string TypeSingle = "SINGLE";
    public const string TypeMultiple = "MULTIPLE";
    public const string TypeRange = "RANGE";
    /// <summary>Interval de realizare (StartDate/EndDate) plus date individuale suplimentare (Dates).</summary>
    public const string TypeMixed = "MIXED";

    public Guid Id { get; set; }
    public Guid ElectionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? AdditionalInfo { get; set; }
    public string Type { get; set; } = TypeSingle;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public DateOnly DeadlineDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? NotificationEmail { get; set; }
    /// <summary>Data la care s-a trimis notificarea (SINGLE / RANGE — o singură dată).</summary>
    public DateOnly? NotificationSentOn { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public Election Election { get; set; } = null!;
    public ICollection<DeadlineDate> Dates { get; set; } = new List<DeadlineDate>();
    public ICollection<DeadlineResponsible> Responsibles { get; set; } = new List<DeadlineResponsible>();
    public ICollection<DeadlineGroup> Groups { get; set; } = new List<DeadlineGroup>();
    public ICollection<Regulation> Regulations { get; set; } = new List<Regulation>();
}
