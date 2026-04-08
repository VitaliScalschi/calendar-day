using CalendarDay.Domain.Entities;

namespace CalendarDay.Application.Contracts.Auth;

public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public record AuthUserDto(
    Guid Id,
    string Email,
    UserRole Role
);

public record LoginResponseDto(
    string AccessToken,
    AuthUserDto User
);
