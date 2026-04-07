namespace CalendarDay.Infrastructure.Auth;

public class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Issuer { get; set; } = "CalendarDay.Api";
    public string Audience { get; set; } = "CalendarDay.Client";
    public string SecretKey { get; set; } = "change-me-to-very-long-secret-key";
    public int ExpirationMinutes { get; set; } = 60;
}
