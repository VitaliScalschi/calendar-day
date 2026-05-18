using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Email;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace CalendarDay.Infrastructure.Email;

public class SmtpEmailService(
    IOptions<SmtpSettings> options,
    ILogger<SmtpEmailService> logger) : IEmailService, IEmailSender
{
    public bool IsConfigured
    {
        get
        {
            var cfg = options.Value;
            return !string.IsNullOrWhiteSpace(cfg.Host)
                && !string.IsNullOrWhiteSpace(cfg.FromEmail);
        }
    }

    public async Task SendEmailAsync(
        string to,
        string subject,
        string body,
        bool isHtml = true,
        CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException(
                "SMTP neconfigurat. Setați Smtp:Host și Smtp:FromEmail (parola în User Secrets sau variabile de mediu).");
        }

        var cfg = options.Value;

        try
        {
            var message = BuildMessage(cfg, to, subject, body, isHtml);
            using var client = new SmtpClient();

            client.Timeout = 30_000;
            if (cfg.AllowInvalidCertificate)
            {
                client.ServerCertificateValidationCallback = static (_, _, _, _) => true;
            }

            var secureSocketOptions = ResolveSecureSocketOptions(cfg);
            await client.ConnectAsync(cfg.Host.Trim(), cfg.Port, secureSocketOptions, ct);

            if (cfg.RequireAuthentication || !string.IsNullOrWhiteSpace(cfg.Username))
            {
                if (string.IsNullOrWhiteSpace(cfg.Username) || string.IsNullOrWhiteSpace(cfg.Password))
                {
                    throw new InvalidOperationException(
                        "SMTP necesită autentificare: setați Smtp:Username și Smtp:Password (User Secrets sau variabile de mediu).");
                }

                await client.AuthenticateAsync(cfg.Username.Trim(), cfg.Password, ct);
            }

            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);

            logger.LogInformation(
                "Email SMTP trimis către {To}. Subiect: {Subject}",
                to,
                subject);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Trimiterea emailului SMTP a eșuat către {To}. Subiect: {Subject}",
                to,
                subject);
            throw;
        }
    }

    public Task SendAsync(EmailMessage message, CancellationToken ct = default) =>
        SendEmailAsync(
            message.ToEmail,
            message.Subject,
            message.HtmlBody,
            isHtml: true,
            ct);

    private static SecureSocketOptions ResolveSecureSocketOptions(SmtpSettings cfg)
    {
        // Port 465 = SSL implicit; port 587 = STARTTLS (mail.cec.md)
        if (cfg.Port == 465)
        {
            return SecureSocketOptions.SslOnConnect;
        }

        if (cfg.Port == 587)
        {
            return SecureSocketOptions.StartTls;
        }

        if (cfg.UseSsl)
        {
            return SecureSocketOptions.SslOnConnect;
        }

        if (cfg.UseStartTls)
        {
            return SecureSocketOptions.StartTls;
        }

        return SecureSocketOptions.Auto;
    }

    private static MimeMessage BuildMessage(SmtpSettings cfg, string to, string subject, string body, bool isHtml)
    {
        var fromName = cfg.FromName.Trim();
        var fromEmail = cfg.FromEmail.Trim();
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(
            string.IsNullOrEmpty(fromName) ? fromEmail : fromName,
            fromEmail));
        message.To.Add(MailboxAddress.Parse(to.Trim()));
        message.Subject = subject;

        var builder = new BodyBuilder();
        if (isHtml)
        {
            builder.HtmlBody = body;
        }
        else
        {
            builder.TextBody = body;
        }

        message.Body = builder.ToMessageBody();
        return message;
    }
}
