namespace CalendarDay.Domain.Entities;

/// <summary>
/// Tipuri fixe de scrutin (id 1–7, denumiri oficiale).
/// </summary>
public class ElectionType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
