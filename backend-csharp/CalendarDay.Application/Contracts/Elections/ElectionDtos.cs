namespace CalendarDay.Application.Contracts.Elections;

public record ElectionDto(
    Guid Id,
    string Title,
    bool IsActive,
    DateOnly Eday,
    bool HasDocument
);

public class CreateElectionDto
{
    public string Title { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateOnly Eday { get; set; }
}

public class UpdateElectionDto
{
    public string Title { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateOnly Eday { get; set; }
}
