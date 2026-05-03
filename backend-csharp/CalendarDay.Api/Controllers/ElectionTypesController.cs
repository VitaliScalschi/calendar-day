using CalendarDay.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Api.Controllers;

[ApiController]
[Route("api/election-types")]
public class ElectionTypesController(CalendarDayDbContext db) : ControllerBase
{
    public sealed record ElectionTypeDto(int Id, string Name);

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ElectionTypeDto>>> Get(CancellationToken ct)
    {
        var items = await db.ElectionTypes
            .AsNoTracking()
            .OrderBy(x => x.Id)
            .Select(x => new ElectionTypeDto(x.Id, x.Name))
            .ToListAsync(ct);

        return Ok(items);
    }
}
