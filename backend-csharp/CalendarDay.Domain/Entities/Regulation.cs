namespace CalendarDay.Domain.Entities;

public class Regulation
{
    public Guid Id { get; set; }
    public Guid DeadlineId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;

    public Deadline Deadline { get; set; } = null!;
}
