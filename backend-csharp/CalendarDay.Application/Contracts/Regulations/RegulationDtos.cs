namespace CalendarDay.Application.Contracts.Regulations;

public record RegulationDto(
    Guid Id,
    Guid DeadlineId,
    Guid? DocumentId,
    string Title,
    string Link
);

public class CreateRegulationDto
{
    public Guid DeadlineId { get; set; }
    public Guid? DocumentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
}

public class UpdateRegulationDto
{
    public Guid? DocumentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
}
