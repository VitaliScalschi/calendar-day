namespace CalendarDay.Application.Contracts.Email;

public record EmailMessage(
    string ToEmail,
    string Subject,
    string HtmlBody,
    string? PlainTextBody = null);
