using CalendarDay.Infrastructure.Seed;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CalendarDay.Api.Controllers;

[Authorize(Roles = "SuperAdmin")]
[ApiController]
[Route("api/seed")]
public class SeedController(SeedFromJsonService seedService) : ControllerBase
{
    [HttpPost("from-json")]
    public async Task<IActionResult> SeedFromJson([FromQuery] string? path, CancellationToken ct)
    {
        // Default path expects frontend seed file in repository root.
        var jsonPath = string.IsNullOrWhiteSpace(path)
            ? Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "src", "data.json"))
            : path;

        await seedService.SeedAsync(jsonPath, ct);
        return Ok(new { message = "Seed completed", jsonPath });
    }
}
