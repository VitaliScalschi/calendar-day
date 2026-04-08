namespace CalendarDay.Domain.Entities;

public class Deadline
{
    public Guid Id { get; set; }
    public Guid ElectionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? AdditionalInfo { get; set; }
    public DateOnly DeadlineDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public Election Election { get; set; } = null!;
    public ICollection<DeadlineResponsible> Responsibles { get; set; } = new List<DeadlineResponsible>();
    public ICollection<DeadlineGroup> Groups { get; set; } = new List<DeadlineGroup>();
    public ICollection<Regulation> Regulations { get; set; } = new List<Regulation>();
}
