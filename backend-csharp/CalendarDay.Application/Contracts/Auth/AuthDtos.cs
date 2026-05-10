namespace CalendarDay.Application.Contracts.Auth;

public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class SiaSessionExchangeRequestDto
{
    public string SessionToken { get; set; } = string.Empty;
}

public record AuthUserDto(
    Guid Id,
    string Email,
    string Role
);

public record LoginResponseDto(
    string AccessToken,
    AuthUserDto User
);
