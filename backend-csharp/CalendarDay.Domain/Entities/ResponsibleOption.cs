namespace CalendarDay.Domain.Entities;

public class ResponsibleOption
{
    public Guid Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}
