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
    public sealed record ResponsibleOptionDto(Guid Id, string Label, int DisplayOrder);
    public sealed record UpsertResponsibleOptionDto(string Label);
    public sealed record ReorderResponsibleOptionDto(Guid Id, int DisplayOrder);

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ResponsibleOptionDto>>> Get(CancellationToken ct)
    {
        await EnsureDisplayOrderColumnAsync(ct);
        var items = await db.ResponsibleOptions
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Label)
            .Select(x => new ResponsibleOptionDto(x.Id, x.Label, x.DisplayOrder))
            .ToListAsync(ct);

        return Ok(items);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<ActionResult<ResponsibleOptionDto>> Create([FromBody] UpsertResponsibleOptionDto dto, CancellationToken ct)
    {
        await EnsureDisplayOrderColumnAsync(ct);
        var label = (dto.Label ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(label))
        {
            return BadRequest(new { message = "Denumirea responsabilului este obligatorie." });
        }

        var exists = await db.ResponsibleOptions.AnyAsync(x => x.Label == label, ct);
        if (exists)
        {
            return BadRequest(new { message = "Acest responsabil există deja." });
        }

        var nextOrder = (await db.ResponsibleOptions.MaxAsync(x => (int?)x.DisplayOrder, ct) ?? 0) + 1;
        var entity = new CalendarDay.Domain.Entities.ResponsibleOption
        {
            Id = Guid.NewGuid(),
            Label = label,
            DisplayOrder = nextOrder,
        };
        db.ResponsibleOptions.Add(entity);
        await db.SaveChangesAsync(ct);

        return Ok(new ResponsibleOptionDto(entity.Id, entity.Label, entity.DisplayOrder));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ResponsibleOptionDto>> Update(Guid id, [FromBody] UpsertResponsibleOptionDto dto, CancellationToken ct)
    {
        await EnsureDisplayOrderColumnAsync(ct);
        var entity = await db.ResponsibleOptions.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        var label = (dto.Label ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(label))
        {
            return BadRequest(new { message = "Denumirea responsabilului este obligatorie." });
        }

        var exists = await db.ResponsibleOptions.AnyAsync(x => x.Id != id && x.Label == label, ct);
        if (exists)
        {
            return BadRequest(new { message = "Acest responsabil există deja." });
        }

        entity.Label = label;
        await db.SaveChangesAsync(ct);
        return Ok(new ResponsibleOptionDto(entity.Id, entity.Label, entity.DisplayOrder));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("reorder")]
    public async Task<ActionResult<IReadOnlyList<ResponsibleOptionDto>>> Reorder([FromBody] List<ReorderResponsibleOptionDto> items, CancellationToken ct)
    {
        await EnsureDisplayOrderColumnAsync(ct);
        if (items is null || items.Count == 0)
        {
            return BadRequest(new { message = "Lista de reordonare este goală." });
        }

        var ids = items.Select(x => x.Id).Distinct().ToArray();
        var entities = await db.ResponsibleOptions.Where(x => ids.Contains(x.Id)).ToListAsync(ct);
        if (entities.Count != ids.Length)
        {
            return BadRequest(new { message = "Unii responsabili nu există." });
        }

        var byId = entities.ToDictionary(x => x.Id);
        foreach (var item in items)
        {
            byId[item.Id].DisplayOrder = item.DisplayOrder;
        }

        await db.SaveChangesAsync(ct);
        var ordered = await db.ResponsibleOptions
            .AsNoTracking()
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Label)
            .Select(x => new ResponsibleOptionDto(x.Id, x.Label, x.DisplayOrder))
            .ToListAsync(ct);
        return Ok(ordered);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await EnsureDisplayOrderColumnAsync(ct);
        var entity = await db.ResponsibleOptions.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        var isUsed = await db.DeadlineResponsibles.AnyAsync(x => x.Value == entity.Label, ct);
        if (isUsed)
        {
            return BadRequest(new { message = "Responsabilul este folosit în acțiuni existente și nu poate fi șters." });
        }

        db.ResponsibleOptions.Remove(entity);
        await db.SaveChangesAsync(ct);

        var ordered = await db.ResponsibleOptions.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Label).ToListAsync(ct);
        for (var index = 0; index < ordered.Count; index++)
        {
            ordered[index].DisplayOrder = index + 1;
        }
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    private Task EnsureDisplayOrderColumnAsync(CancellationToken ct) =>
        db.Database.ExecuteSqlRawAsync(
            """
            DO $$
            BEGIN
                IF to_regclass('public.responsible_options') IS NOT NULL THEN
                    EXECUTE 'ALTER TABLE public.responsible_options ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0';
                ELSIF to_regclass('public."ResponsibleOptions"') IS NOT NULL THEN
                    EXECUTE 'ALTER TABLE public."ResponsibleOptions" ADD COLUMN IF NOT EXISTS "display_order" integer NOT NULL DEFAULT 0';
                END IF;
            END $$;
            """,
            ct
        );
}
