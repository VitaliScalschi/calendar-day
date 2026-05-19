using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CalendarDay.Infrastructure.Services;

public class DeadlineNotificationHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<DeadlineNotificationHostedService> logger) : BackgroundService
{
    private static readonly TimeZoneInfo ChisinauTimeZone = ResolveChisinauTimeZone();
    private DateOnly? _lastProcessedDate;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Serviciul de notificări eveniment (00:00) a pornit.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ChisinauTimeZone);
                var localToday = DateOnly.FromDateTime(localNow);

                if (localNow.Hour == 0 && _lastProcessedDate != localToday)
                {
                    using var scope = scopeFactory.CreateScope();
                    var processor = scope.ServiceProvider.GetRequiredService<DeadlineNotificationProcessor>();
                    var sent = await processor.SendDueNotificationsAsync(localToday, stoppingToken);
                    _lastProcessedDate = localToday;
                    if (sent > 0)
                    {
                        logger.LogInformation("Notificări eveniment trimise: {Count} (data locală {Date})", sent, localToday);
                    }
                }
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Eroare în serviciul de notificări eveniment.");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private static TimeZoneInfo ResolveChisinauTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Europe/Chisinau");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("E. Europe Standard Time");
        }
    }
}
