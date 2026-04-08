namespace CalendarDay.Domain.Entities;

public class DeadlineGroup
{
    public Guid Id { get; set; }
    public Guid DeadlineId { get; set; }
    public string Value { get; set; } = string.Empty;

    public Deadline Deadline { get; set; } = null!;
}
