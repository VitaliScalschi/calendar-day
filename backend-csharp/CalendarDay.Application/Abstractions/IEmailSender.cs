using CalendarDay.Application.Contracts.Email;

namespace CalendarDay.Application.Abstractions;

public interface IEmailSender
{
    bool IsConfigured { get; }

    Task SendAsync(EmailMessage message, CancellationToken ct = default);
}
