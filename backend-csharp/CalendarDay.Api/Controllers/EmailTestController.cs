using CalendarDay.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CalendarDay.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin/email-test")]
public class EmailTestController(IEmailService emailService) : ControllerBase
{
    public record SendTestEmailRequest(string To);

    [HttpPost]
    public async Task<IActionResult> Send([FromBody] SendTestEmailRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.To))
        {
            return BadRequest(new { message = "Adresa 'to' este obligatorie." });
        }

        if (!emailService.IsConfigured)
        {
            return StatusCode(500, new { message = "SMTP neconfigurat (Smtp:Host / Smtp:FromEmail lipsesc)." });
        }

        await emailService.SendEmailAsync(
            request.To.Trim(),
            "Test SMTP — Calendar CEC",
            "Acesta este un email de test trimis din panoul de administrare.\n\nDacă l-ai primit, SMTP funcționează corect.",
            isHtml: false,
            ct);

        return Ok(new { message = $"Email de test trimis către {request.To.Trim()}." });
    }
}
