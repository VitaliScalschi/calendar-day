using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Api.Controllers;

[ApiController]
[Route("api/subdivisions")]
public class SubdivisionsController(CalendarDayDbContext db) : ControllerBase
{
    public sealed record SubdivisionDto(Guid Id, string Name, string Code, bool IsActive, DateTime CreatedAtUtc, DateTime UpdatedAtUtc);
    public sealed record UpsertSubdivisionDto(string Name, string Code, bool? IsActive);

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SubdivisionDto>>> Get(CancellationToken ct)
    {
        var items = await db.Subdivisions
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new SubdivisionDto(x.Id, x.Name, x.Code, x.IsActive, x.CreatedAtUtc, x.UpdatedAtUtc))
            .ToListAsync(ct);

        return Ok(items);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<ActionResult<SubdivisionDto>> Create([FromBody] UpsertSubdivisionDto dto, CancellationToken ct)
    {
        var name = (dto.Name ?? string.Empty).Trim();
        var code = (dto.Code ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "Denumirea departamentului este obligatorie." });
        }
        if (string.IsNullOrWhiteSpace(code))
        {
            return BadRequest(new { message = "Codul departamentului este obligatoriu." });
        }
        if (name.Length > 250)
        {
            return BadRequest(new { message = "Denumirea departamentului poate avea cel mult 250 caractere." });
        }
        if (code.Length > 50)
        {
            return BadRequest(new { message = "Codul departamentului poate avea cel mult 50 caractere." });
        }

        var codeExists = await db.Subdivisions.AnyAsync(x => x.Code == code, ct);
        if (codeExists)
        {
            return BadRequest(new { message = "Există deja un departament cu acest cod." });
        }

        var now = DateTime.UtcNow;
        var entity = new Subdivision
        {
            Id = Guid.NewGuid(),
            Name = name,
            Code = code,
            IsActive = dto.IsActive ?? true,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };

        db.Subdivisions.Add(entity);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(
            nameof(Get),
            new { id = entity.Id },
            new SubdivisionDto(entity.Id, entity.Name, entity.Code, entity.IsActive, entity.CreatedAtUtc, entity.UpdatedAtUtc));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SubdivisionDto>> Update(Guid id, [FromBody] UpsertSubdivisionDto dto, CancellationToken ct)
    {
        var entity = await db.Subdivisions.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        var name = (dto.Name ?? string.Empty).Trim();
        var code = (dto.Code ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            return BadRequest(new { message = "Denumirea departamentului este obligatorie." });
        }
        if (string.IsNullOrWhiteSpace(code))
        {
            return BadRequest(new { message = "Codul departamentului este obligatoriu." });
        }
        if (name.Length > 250)
        {
            return BadRequest(new { message = "Denumirea departamentului poate avea cel mult 250 caractere." });
        }
        if (code.Length > 50)
        {
            return BadRequest(new { message = "Codul departamentului poate avea cel mult 50 caractere." });
        }

        var codeExists = await db.Subdivisions.AnyAsync(x => x.Code == code && x.Id != id, ct);
        if (codeExists)
        {
            return BadRequest(new { message = "Există deja un departament cu acest cod." });
        }

        entity.Name = name;
        entity.Code = code;
        if (dto.IsActive.HasValue)
        {
            entity.IsActive = dto.IsActive.Value;
        }
        entity.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return Ok(new SubdivisionDto(entity.Id, entity.Name, entity.Code, entity.IsActive, entity.CreatedAtUtc, entity.UpdatedAtUtc));
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var entity = await db.Subdivisions.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null)
        {
            return NotFound();
        }

        db.Subdivisions.Remove(entity);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
