using CalendarDay.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Api.Controllers;

[ApiController]
[Route("api/election-types")]
public class ElectionTypesController(CalendarDayDbContext db) : ControllerBase
{
    public sealed record ElectionTypeDto(int Id, string Name, int DisplayOrder);
    public sealed record UpsertElectionTypeDto(string Name);
    public sealed record ReorderElectionTypeDto(int Id, int DisplayOrder);

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ElectionTypeDto>>> Get(CancellationToken ct)
    {
        var items = await db.ElectionTypes
            .AsNoTracking()
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Id)
            .Select(x => new ElectionTypeDto(x.Id, x.Name, x.DisplayOrder))
            .ToListAsync(ct);

        return Ok(items);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<ActionResult<ElectionTypeDto>> Create([FromBody] UpsertElectionTypeDto dto, CancellationToken ct)
    {
        var name = (dto.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "Numele tipului de scrutin este obligatoriu." });
        }

        var exists = await db.ElectionTypes.AnyAsync(x => x.Name.ToLower() == name.ToLower(), ct);
        if (exists)
        {
            return BadRequest(new { message = "Tipul de scrutin există deja." });
        }

        var nextId = (await db.ElectionTypes.MaxAsync(x => (int?)x.Id, ct) ?? 0) + 1;
        var nextOrder = (await db.ElectionTypes.MaxAsync(x => (int?)x.DisplayOrder, ct) ?? 0) + 1;
        var entity = new CalendarDay.Domain.Entities.ElectionType
        {
            Id = nextId,
            Name = name,
            DisplayOrder = nextOrder,
        };
        db.ElectionTypes.Add(entity);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = entity.Id }, new ElectionTypeDto(entity.Id, entity.Name, entity.DisplayOrder));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ElectionTypeDto>> Update(int id, [FromBody] UpsertElectionTypeDto dto, CancellationToken ct)
    {
        var entity = await db.ElectionTypes.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        var name = (dto.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "Numele tipului de scrutin este obligatoriu." });
        }

        var duplicateExists = await db.ElectionTypes.AnyAsync(x => x.Id != id && x.Name.ToLower() == name.ToLower(), ct);
        if (duplicateExists)
        {
            return BadRequest(new { message = "Tipul de scrutin există deja." });
        }

        entity.Name = name;
        await db.SaveChangesAsync(ct);
        return Ok(new ElectionTypeDto(entity.Id, entity.Name, entity.DisplayOrder));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("reorder")]
    public async Task<ActionResult<IReadOnlyList<ElectionTypeDto>>> Reorder([FromBody] List<ReorderElectionTypeDto> items, CancellationToken ct)
    {
        if (items is null || items.Count == 0)
        {
            return BadRequest(new { message = "Lista de reordonare este goală." });
        }

        var ids = items.Select(x => x.Id).Distinct().ToArray();
        var entities = await db.ElectionTypes.Where(x => ids.Contains(x.Id)).ToListAsync(ct);
        if (entities.Count != ids.Length)
        {
            return BadRequest(new { message = "Unele tipuri de scrutin nu există." });
        }

        var byId = entities.ToDictionary(x => x.Id);
        foreach (var item in items)
        {
            byId[item.Id].DisplayOrder = item.DisplayOrder;
        }

        await db.SaveChangesAsync(ct);

        var ordered = await db.ElectionTypes
            .AsNoTracking()
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Id)
            .Select(x => new ElectionTypeDto(x.Id, x.Name, x.DisplayOrder))
            .ToListAsync(ct);

        return Ok(ordered);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await db.ElectionTypes.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        var isUsed = await db.Elections.AnyAsync(x => x.ElectionTypeIds.Any(typeId => typeId == id), ct);
        if (isUsed)
        {
            return BadRequest(new { message = "Tipul de scrutin este folosit în programe existente și nu poate fi șters." });
        }

        db.ElectionTypes.Remove(entity);
        await db.SaveChangesAsync(ct);

        var ordered = await db.ElectionTypes
            .OrderBy(x => x.DisplayOrder)
            .ThenBy(x => x.Id)
            .ToListAsync(ct);

        for (var index = 0; index < ordered.Count; index++)
        {
            ordered[index].DisplayOrder = index + 1;
        }
        await db.SaveChangesAsync(ct);

        return NoContent();
    }
}
