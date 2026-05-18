namespace CalendarDay.Infrastructure.Email;

public class SmtpSettings
{
    public const string SectionName = "Smtp";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 465;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = "Calendar CEC";

    /// <summary>Când true (implicit), se autentifică dacă Username este setat.</summary>
    public bool RequireAuthentication { get; set; } = true;

    /// <summary>SSL implicit la conectare (port 465, mail.cec.md).</summary>
    public bool UseSsl { get; set; } = true;

    /// <summary>STARTTLS pe port 587 — lăsați false pentru port 465.</summary>
    public bool UseStartTls { get; set; }

    /// <summary>
    /// mail.cec.md folosește certificat *.gov.md — activați dacă primiți eroare SSL hostname mismatch.
    /// </summary>
    public bool AllowInvalidCertificate { get; set; } = true;
}
