namespace CalendarDay.Infrastructure.Email;

public class PasswordResetOptions
{
    public const string SectionName = "PasswordReset";

    /// <summary>URL public al frontend-ului, fără slash final (ex. https://calendar.cec.md).</summary>
    public string FrontendBaseUrl { get; set; } = "http://localhost:5173";

    public int TokenLifetimeMinutes { get; set; } = 60;

    /// <summary>În Development, returnează linkul în JSON dacă SMTP nu e configurat.</summary>
    public bool ExposeDevResetLinkWhenEmailDisabled { get; set; } = true;

    public int MaxRequestsPerEmailPerHour { get; set; } = 3;
    public int MaxRequestsPerIpPerHour { get; set; } = 10;
}
