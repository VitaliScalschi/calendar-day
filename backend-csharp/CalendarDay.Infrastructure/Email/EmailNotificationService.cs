using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Email;
using Microsoft.Extensions.Logging;

namespace CalendarDay.Infrastructure.Email;

public class EmailNotificationService(
    IEmailSender emailSender,
    ILogger<EmailNotificationService> logger) : IEmailNotificationService
{
    public bool IsDeliveryConfigured => emailSender.IsConfigured;

    public async Task<bool> SendPasswordResetLinkAsync(
        string toEmail,
        string resetLink,
        int lifetimeMinutes,
        CancellationToken ct = default)
    {
        var html = EmailTemplates.PasswordReset(toEmail, resetLink, lifetimeMinutes);
        var plain = $"Resetare parolă Calendar CEC.\n\nDeschideți linkul (expiră în {lifetimeMinutes} min):\n{resetLink}";

        return await SendAsync(
            new EmailMessage(toEmail, "Resetare parolă — Calendar CEC", html, plain),
            ct);
    }

    public Task<bool> SendEventNotificationAsync(
        string toEmail,
        string eventTitle,
        string eventDetailsHtml,
        CancellationToken ct = default)
    {
        var html = EmailTemplates.EventNotification(eventTitle, eventDetailsHtml);
        var plain = $"Notificare eveniment: {eventTitle}";

        return SendAsync(
            new EmailMessage(toEmail, $"Eveniment: {eventTitle}", html, plain),
            ct);
    }

    private async Task<bool> SendAsync(EmailMessage message, CancellationToken ct)
    {
        if (!emailSender.IsConfigured)
        {
            logger.LogWarning(
                "SMTP neconfigurat — emailul NU a fost trimis către {Email}. Subiect: {Subject}",
                message.ToEmail,
                message.Subject);
            return false;
        }

        try
        {
            await emailSender.SendAsync(message, ct);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Trimiterea emailului a eșuat către {Email}. Subiect: {Subject}",
                message.ToEmail,
                message.Subject);
            return false;
        }
    }
}
