namespace CalendarDay.Application.Contracts.UsefulInfos;

public record UsefulInfoDto(
    Guid Id,
    string Title,
    string Slug,
    string Type,
    string Content,
    string Icon,
    bool Status,
    int Order,
    DateTime UpdatedAtUtc
);

public class CreateUsefulInfoDto
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Type { get; set; } = "page";
    public string Content { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public bool Status { get; set; } = true;
    public int Order { get; set; } = 1;
}

public class UpdateUsefulInfoDto : CreateUsefulInfoDto;
