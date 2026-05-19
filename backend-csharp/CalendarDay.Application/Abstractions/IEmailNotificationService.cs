namespace CalendarDay.Application.Abstractions;

public interface IEmailNotificationService
{
    bool IsDeliveryConfigured { get; }

    Task<bool> SendPasswordResetLinkAsync(
        string toEmail,
        string resetLink,
        int lifetimeMinutes,
        CancellationToken ct = default);

    Task<bool> SendEventNotificationAsync(
        string toEmail,
        string eventTitle,
        string eventDetailsHtml,
        CancellationToken ct = default);
}
