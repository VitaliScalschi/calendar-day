namespace CalendarDay.Application.Contracts.Users;

public record UserDto(
    Guid Id,
    string Email,
    string Role,
    bool IsActive,
    DateTime CreatedAtUtc
);

public class CreateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Viewer";
    public bool IsActive { get; set; } = true;
}

public class UpdateUserDto
{
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string Role { get; set; } = "Viewer";
    public bool IsActive { get; set; } = true;
}
