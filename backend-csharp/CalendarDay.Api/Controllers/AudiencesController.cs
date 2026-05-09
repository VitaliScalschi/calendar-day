using CalendarDay.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Api.Controllers;

[ApiController]
[Route("api/audiences")]
public class AudiencesController(CalendarDayDbContext db) : ControllerBase
{
    public sealed record AudienceDto(long Id, string Key, string Name, int DisplayOrder);
    public sealed record UpsertAudienceDto(string Name);
    public sealed record ReorderAudienceDto(long Id, int DisplayOrder);

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AudienceDto>>> Get(CancellationToken ct)
    {
        await EnsureDisplayOrderColumnAsync(ct);
        var items = await db.Audiences
            .AsNoTracking()
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Id)
            .Select(x => new AudienceDto(x.Id, x.Key, x.Name, x.DisplayOrder))
            .ToListAsync(ct);

        return Ok(items);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<ActionResult<AudienceDto>> Create([FromBody] UpsertAudienceDto dto, CancellationToken ct)
    {
        await EnsureDisplayOrderColumnAsync(ct);
        var name = (dto.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "Denumirea grupului țintă este obligatorie." });
        }

        var baseKey = BuildAudienceKey(name);
        var key = baseKey;
        var suffix = 2;
        while (await db.Audiences.AnyAsync(x => x.Key == key, ct))
        {
            key = $"{baseKey}_{suffix++}";
        }

        var nextOrder = (await db.Audiences.MaxAsync(x => (int?)x.DisplayOrder, ct) ?? 0) + 1;
        var entity = new CalendarDay.Domain.Entities.Audience
        {
            Key = key,
            Name = name,
            DisplayOrder = nextOrder,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        db.Audiences.Add(entity);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = entity.Id }, new AudienceDto(entity.Id, entity.Key, entity.Name, entity.DisplayOrder));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id:long}")]
    public async Task<ActionResult<AudienceDto>> Update(long id, [FromBody] UpsertAudienceDto dto, CancellationToken ct)
    {
        await EnsureDisplayOrderColumnAsync(ct);
        var entity = await db.Audiences.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        var name = (dto.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "Denumirea grupului țintă este obligatorie." });
        }

        entity.Name = name;
        await db.SaveChangesAsync(ct);
        return Ok(new AudienceDto(entity.Id, entity.Key, entity.Name, entity.DisplayOrder));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("reorder")]
    public async Task<ActionResult<IReadOnlyList<AudienceDto>>> Reorder([FromBody] List<ReorderAudienceDto> items, CancellationToken ct)
    {
        await EnsureDisplayOrderColumnAsync(ct);
        if (items is null || items.Count == 0)
        {
            return BadRequest(new { message = "Lista de reordonare este goală." });
        }

        var ids = items.Select(x => x.Id).Distinct().ToArray();
        var entities = await db.Audiences.Where(x => ids.Contains(x.Id)).ToListAsync(ct);
        if (entities.Count != ids.Length)
        {
            return BadRequest(new { message = "Unele grupuri țintă nu există." });
        }

        var byId = entities.ToDictionary(x => x.Id);
        foreach (var item in items)
        {
            byId[item.Id].DisplayOrder = item.DisplayOrder;
        }

        await db.SaveChangesAsync(ct);
        var ordered = await db.Audiences
            .AsNoTracking()
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Id)
            .Select(x => new AudienceDto(x.Id, x.Key, x.Name, x.DisplayOrder))
            .ToListAsync(ct);
        return Ok(ordered);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        await EnsureDisplayOrderColumnAsync(ct);
        var entity = await db.Audiences.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        var isUsed = await db.DeadlineGroups.AnyAsync(x => x.Value == entity.Key, ct);
        if (isUsed)
        {
            return BadRequest(new { message = "Grupul țintă este folosit în acțiuni existente și nu poate fi șters." });
        }

        db.Audiences.Remove(entity);
        await db.SaveChangesAsync(ct);

        var ordered = await db.Audiences.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Id).ToListAsync(ct);
        for (var index = 0; index < ordered.Count; index++)
        {
            ordered[index].DisplayOrder = index + 1;
        }
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static string BuildAudienceKey(string name)
    {
        var chars = name.ToLowerInvariant().Select(c =>
            char.IsLetterOrDigit(c) ? c : '_').ToArray();
        var raw = new string(chars);
        while (raw.Contains("__", StringComparison.Ordinal))
        {
            raw = raw.Replace("__", "_", StringComparison.Ordinal);
        }

        return raw.Trim('_');
    }

    private Task EnsureDisplayOrderColumnAsync(CancellationToken ct) =>
        db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE audiences ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;",
            ct
        );
}
