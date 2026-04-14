using CalendarDay.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/responsible-options")]
public class ResponsibleOptionsController(CalendarDayDbContext db) : ControllerBase
{
    public sealed record ResponsibleOptionDto(Guid Id, string Label);

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ResponsibleOptionDto>>> Get(CancellationToken ct)
    {
        var items = await db.ResponsibleOptions
            .OrderBy(x => x.Label)
            .Select(x => new ResponsibleOptionDto(x.Id, x.Label))
            .ToListAsync(ct);

        return Ok(items);
    }
}
