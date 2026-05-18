using System.Net;

namespace CalendarDay.Infrastructure.Email;

internal static class EmailTemplates
{
    public static string PasswordReset(string email, string resetLink, int lifetimeMinutes)
    {
        var safeEmail = WebUtility.HtmlEncode(email);
        var safeLink = WebUtility.HtmlEncode(resetLink);
        return $"""
            <div style="font-family:Segoe UI,Arial,sans-serif;color:#111827;line-height:1.5;">
              <p>Bună ziua,</p>
              <p>Ați solicitat resetarea parolei pentru contul <strong>{safeEmail}</strong> în aplicația Calendar CEC.</p>
              <p style="margin:1.5rem 0;">
                <a href="{safeLink}" style="display:inline-block;padding:0.65rem 1.25rem;background:#067fc3;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
                  Setează parolă nouă
                </a>
              </p>
              <p style="font-size:0.9rem;color:#6b7280;">Linkul expiră în {lifetimeMinutes} minute. Dacă nu ați solicitat resetarea, ignorați acest mesaj.</p>
            </div>
            """;
    }

    public static string EventNotification(string eventTitle, string eventDetailsHtml)
    {
        var safeTitle = WebUtility.HtmlEncode(eventTitle);
        return $"""
            <div style="font-family:Segoe UI,Arial,sans-serif;color:#111827;line-height:1.5;">
              <h2 style="margin:0 0 1rem;font-size:1.15rem;">Notificare eveniment — Calendar CEC</h2>
              <p style="font-weight:600;">{safeTitle}</p>
              <div>{eventDetailsHtml}</div>
            </div>
            """;
    }
}
