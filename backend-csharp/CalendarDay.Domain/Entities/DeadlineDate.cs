namespace CalendarDay.Domain.Entities;

public class DeadlineDate
{
    public Guid Id { get; set; }
    public Guid DeadlineId { get; set; }
    public DateOnly EventDate { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Deadline Deadline { get; set; } = null!;
}
