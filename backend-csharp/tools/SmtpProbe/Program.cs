using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

var apiDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "CalendarDay.Api"));
var config = new ConfigurationBuilder()
    .SetBasePath(apiDir)
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile("appsettings.Development.local.json", optional: true)
    .Build();

var host = config["Smtp:Host"] ?? "";
var port = int.Parse(config["Smtp:Port"] ?? "465");
var user = config["Smtp:Username"] ?? "";
var pass = config["Smtp:Password"] ?? "";
var from = config["Smtp:FromEmail"] ?? user;
var to = args.Length > 0 ? args[0] : user;

Console.WriteLine($"Host={host} Port={port} User={user} From={from} To={to}");
Console.WriteLine($"Password set: {!string.IsNullOrWhiteSpace(pass)}");

try
{
    using var client = new SmtpClient { Timeout = 30_000 };
    var allowInvalid = bool.TryParse(config["Smtp:AllowInvalidCertificate"], out var a) && a;
    if (allowInvalid)
    {
        client.ServerCertificateValidationCallback = static (_, _, _, _) => true;
    }

    var secure = port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
    Console.WriteLine($"Connecting with {secure}...");
    await client.ConnectAsync(host, port, secure);
    Console.WriteLine("Connected.");

    if (!string.IsNullOrWhiteSpace(user))
    {
        await client.AuthenticateAsync(user, pass);
        Console.WriteLine("Authenticated.");
    }

    var msg = new MimeMessage();
    msg.From.Add(MailboxAddress.Parse(from));
    msg.To.Add(MailboxAddress.Parse(to));
    msg.Subject = "Test SMTP Calendar CEC";
    msg.Body = new TextPart("plain") { Text = "Test trimitere SMTP din SmtpProbe." };

    await client.SendAsync(msg);
    await client.DisconnectAsync(true);
    Console.WriteLine("SUCCESS: email sent.");
}
catch (Exception ex)
{
    Console.WriteLine($"FAILED: {ex.GetType().Name}: {ex.Message}");
    if (ex.InnerException is not null)
    {
        Console.WriteLine($"  Inner: {ex.InnerException.Message}");
    }
    Environment.Exit(1);
}
