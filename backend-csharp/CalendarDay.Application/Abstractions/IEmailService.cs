namespace CalendarDay.Application.Abstractions;

public interface IEmailService
{
    bool IsConfigured { get; }

    Task SendEmailAsync(
        string to,
        string subject,
        string body,
        bool isHtml = true,
        CancellationToken ct = default);
}
