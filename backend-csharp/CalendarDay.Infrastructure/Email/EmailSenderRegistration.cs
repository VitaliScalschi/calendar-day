using CalendarDay.Application.Abstractions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CalendarDay.Infrastructure.Email;

public static class EmailSenderRegistration
{
    public static IServiceCollection AddEmailDelivery(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<SmtpSettings>(configuration.GetSection(SmtpSettings.SectionName));
        services.Configure<PasswordResetOptions>(configuration.GetSection(PasswordResetOptions.SectionName));

        services.AddMemoryCache();
        services.AddSingleton<PasswordResetRateLimiter>();
        services.AddScoped<SmtpEmailService>();
        services.AddScoped<IEmailService>(sp => sp.GetRequiredService<SmtpEmailService>());
        services.AddScoped<IEmailSender>(sp => sp.GetRequiredService<SmtpEmailService>());
        services.AddScoped<IEmailNotificationService, EmailNotificationService>();

        return services;
    }

    public static bool IsEmailDeliveryConfigured(IConfiguration configuration)
    {
        var cfg = configuration.GetSection(SmtpSettings.SectionName).Get<SmtpSettings>() ?? new SmtpSettings();
        return !string.IsNullOrWhiteSpace(cfg.Host) && !string.IsNullOrWhiteSpace(cfg.FromEmail);
    }

    public static string GetActiveProviderName() => "SMTP";
}
