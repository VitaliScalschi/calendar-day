using System.Globalization;
using System.Net;
using System.Text;
using CalendarDay.Application.Abstractions;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CalendarDay.Infrastructure.Services;

public class DeadlineNotificationProcessor(
    CalendarDayDbContext db,
    IEmailNotificationService emailNotification,
    ILogger<DeadlineNotificationProcessor> logger)
{
    public async Task<int> SendDueNotificationsAsync(DateOnly localToday, CancellationToken ct = default)
    {
        var deadlines = await db.Deadlines
            .Include(d => d.Election)
            .Include(d => d.Dates)
            .Include(d => d.Responsibles)
            .Where(d => d.NotificationEmail != null && d.NotificationEmail != "")
            .ToListAsync(ct);

        var sentCount = 0;
        foreach (var deadline in deadlines)
        {
            try
            {
                if (deadline.Type == Deadline.TypeMultiple)
                {
                    sentCount += await SendMultipleDateNotificationsAsync(deadline, localToday, ct);
                }
                else if (await TrySendSingleOrRangeNotificationAsync(deadline, localToday, ct))
                {
                    sentCount++;
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Notificare eveniment eșuată pentru deadline {DeadlineId}", deadline.Id);
            }
        }

        if (sentCount > 0)
        {
            await db.SaveChangesAsync(ct);
        }

        return sentCount;
    }

    private async Task<int> SendMultipleDateNotificationsAsync(Deadline deadline, DateOnly localToday, CancellationToken ct)
    {
        var sent = 0;
        var recipients = DeadlineNotificationEmails.Parse(deadline.NotificationEmail);
        if (recipients.Count == 0) return 0;

        foreach (var dateRow in deadline.Dates.Where(d => d.EventDate == localToday && d.NotificationSentOn != localToday))
        {
            var detailsHtml = BuildDetailsHtml(deadline, FormatDateLabel(localToday));
            if (!await SendToAllRecipientsAsync(recipients, deadline.Title, detailsHtml, ct))
            {
                continue;
            }

            dateRow.NotificationSentOn = localToday;
            sent++;
        }

        return sent;
    }

    private async Task<bool> TrySendSingleOrRangeNotificationAsync(Deadline deadline, DateOnly localToday, CancellationToken ct)
    {
        if (deadline.NotificationSentOn == localToday)
        {
            return false;
        }

        var triggerDate = GetNotificationTriggerDate(deadline);
        if (triggerDate != localToday)
        {
            return false;
        }

        var recipients = DeadlineNotificationEmails.Parse(deadline.NotificationEmail);
        if (recipients.Count == 0)
        {
            return false;
        }

        var dateLabel = deadline.Type == Deadline.TypeRange && deadline.StartDate.HasValue && deadline.EndDate.HasValue
            ? $"{FormatDateLabel(deadline.StartDate.Value)} – {FormatDateLabel(deadline.EndDate.Value)}"
            : FormatDateLabel(triggerDate);

        var detailsHtml = BuildDetailsHtml(deadline, dateLabel);
        if (!await SendToAllRecipientsAsync(recipients, deadline.Title, detailsHtml, ct))
        {
            return false;
        }

        deadline.NotificationSentOn = localToday;
        return true;
    }

    private async Task<bool> SendToAllRecipientsAsync(
        IReadOnlyList<string> recipients,
        string eventTitle,
        string detailsHtml,
        CancellationToken ct)
    {
        var sentToAny = false;
        foreach (var email in recipients)
        {
            var ok = await emailNotification.SendEventNotificationAsync(email, eventTitle, detailsHtml, ct);
            sentToAny = sentToAny || ok;
        }

        return sentToAny;
    }

    private static DateOnly GetNotificationTriggerDate(Deadline deadline)
    {
        if (deadline.Type == Deadline.TypeRange)
        {
            return deadline.StartDate ?? deadline.DeadlineDate;
        }

        return deadline.StartDate ?? deadline.DeadlineDate;
    }

    private static string BuildDetailsHtml(Deadline deadline, string periodLabel)
    {
        var sb = new StringBuilder();
        sb.Append("<p><strong>Scrutin:</strong> ").Append(WebUtility.HtmlEncode(deadline.Election.Title)).Append("</p>");
        sb.Append("<p><strong>Perioadă:</strong> ").Append(WebUtility.HtmlEncode(periodLabel)).Append("</p>");

        if (!string.IsNullOrWhiteSpace(deadline.Description))
        {
            sb.Append("<p><strong>Descriere:</strong><br/>")
                .Append(WebUtility.HtmlEncode(deadline.Description).Replace("\n", "<br/>", StringComparison.Ordinal))
                .Append("</p>");
        }

        var responsibles = deadline.Responsibles.Select(r => r.Value).Where(v => !string.IsNullOrWhiteSpace(v)).ToList();
        if (responsibles.Count > 0)
        {
            sb.Append("<p><strong>Responsabili:</strong> ")
                .Append(WebUtility.HtmlEncode(string.Join(", ", responsibles)))
                .Append("</p>");
        }

        sb.Append("<p style=\"font-size:0.9rem;color:#6b7280;margin-top:1rem;\">Acest email a fost trimis automat la ora 00:00 în ziua evenimentului.</p>");
        return sb.ToString();
    }

    private static string FormatDateLabel(DateOnly date) =>
        date.ToString("dd.MM.yyyy", CultureInfo.InvariantCulture);
}
