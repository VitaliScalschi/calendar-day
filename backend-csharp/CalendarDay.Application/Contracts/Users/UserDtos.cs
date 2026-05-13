namespace CalendarDay.Application.Contracts.Users;

public record UserDto(
    Guid Id,
    string Email,
    string Role,
    IReadOnlyList<string> Roles,
    bool IsActive,
    DateTime CreatedAtUtc,
    Guid? SubdivisionId,
    string? SubdivisionName,
    string? SubdivisionCode
);

public class CreateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Viewer";
    public bool IsActive { get; set; } = true;
    public Guid? SubdivisionId { get; set; }
}

public class UpdateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string Role { get; set; } = "Viewer";
    public bool IsActive { get; set; } = true;
    public Guid? SubdivisionId { get; set; }
}

public class AssignRoleDto
{
    public string Role { get; set; } = string.Empty;
}

public class ChangeUserRoleDto
{
    public string FromRole { get; set; } = string.Empty;
    public string ToRole { get; set; } = string.Empty;
}
