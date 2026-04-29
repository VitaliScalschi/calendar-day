using CalendarDay.Application.Contracts.Regulations;

namespace CalendarDay.Application.Contracts.Deadlines;

public record DeadlineDto(
    Guid Id,
    Guid ElectionId,
    string ElectionTitle,
    string Title,
    string? AdditionalInfo,
    string Type,
    string? StartDate,
    string? EndDate,
    IReadOnlyList<string> Deadlines,
    string Description,
    IReadOnlyList<string> Responsible,
    IReadOnlyList<string> Group,
    IReadOnlyList<RegulationDto> Regulations
);

public class CreateDeadlineDto
{
    public Guid ElectionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? AdditionalInfo { get; set; }
    public string Deadline { get; set; } = string.Empty;
    public List<string> Deadlines { get; set; } = [];
    public string Description { get; set; } = string.Empty;
    public List<string> Responsible { get; set; } = [];
    public List<string> Group { get; set; } = [];
}

public class UpdateDeadlineDto : CreateDeadlineDto;

public class DeadlineQuery
{
    public Guid? ElectionId { get; set; }
    public string? Group { get; set; }
    public string? Responsible { get; set; }
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
    public string Sort { get; set; } = "asc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public record DeadlinesByElectionDto(
    Guid ElectionId,
    string ElectionTitle,
    IReadOnlyList<DeadlineDto> Deadlines
);
