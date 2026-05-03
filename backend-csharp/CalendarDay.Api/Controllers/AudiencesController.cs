using CalendarDay.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Api.Controllers;

[ApiController]
[Route("api/audiences")]
public class AudiencesController(CalendarDayDbContext db) : ControllerBase
{
    public sealed record AudienceDto(string Key, string Name);

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AudienceDto>>> Get(CancellationToken ct)
    {
        var items = await db.Audiences
            .AsNoTracking()
            .OrderBy(x => x.Id)
            .Select(x => new AudienceDto(x.Key, x.Name))
            .ToListAsync(ct);

        return Ok(items);
    }
}
