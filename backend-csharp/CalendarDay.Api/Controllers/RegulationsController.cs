using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Regulations;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace CalendarDay.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/regulations")]
public class RegulationsController(IRegulationsService service, CalendarDayDbContext db) : ControllerBase
{
    [Authorize(Roles = "SuperAdmin,Editor")]
    [HttpPost("upload-document")]
    public async Task<ActionResult<object>> UploadDocument([FromForm] IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "Fișierul este obligatoriu." });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".pdf")
        {
            return BadRequest(new { message = "Este permis doar fișier PDF." });
        }

        var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "regulations");
        Directory.CreateDirectory(uploadDir);

        var safeFileName = $"{Guid.NewGuid()}{extension}";
        var fullPath = Path.Combine(uploadDir, safeFileName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream, ct);
        }

        var relativeUrl = $"/uploads/regulations/{safeFileName}";
        var document = new Document
        {
            Id = Guid.NewGuid(),
            OriginalName = file.FileName,
            StoredName = safeFileName,
            RelativeUrl = relativeUrl,
            ContentType = file.ContentType ?? "application/pdf",
            SizeBytes = file.Length,
            CreatedAtUtc = DateTime.UtcNow
        };
        db.Documents.Add(document);
        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            documentId = document.Id,
            url = relativeUrl,
            originalName = file.FileName,
            title = Path.GetFileNameWithoutExtension(file.FileName)
        });
    }

    [Authorize(Roles = "SuperAdmin,Editor")]
    [HttpPost]
    public async Task<ActionResult<RegulationDto>> Create([FromBody] CreateRegulationDto dto, CancellationToken ct)
    {
        var created = await service.CreateAsync(dto, ct);
        return Ok(created);
    }

    [Authorize(Roles = "SuperAdmin,Editor")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<RegulationDto>> Update(Guid id, [FromBody] UpdateRegulationDto dto, CancellationToken ct)
    {
        var updated = await service.UpdateAsync(id, dto, ct);
        return updated is null ? NotFound() : Ok(updated);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var deleted = await service.DeleteAsync(id, ct);
        if (!deleted) return NotFound();

        var orphanDocumentIds = await db.Documents
            .Where(d => !db.Regulations.Any(r => r.DocumentId == d.Id))
            .Select(d => d.Id)
            .ToListAsync(ct);
        if (orphanDocumentIds.Count > 0)
        {
            var orphanDocuments = await db.Documents.Where(d => orphanDocumentIds.Contains(d.Id)).ToListAsync(ct);
            foreach (var doc in orphanDocuments)
            {
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", doc.RelativeUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(fullPath))
                {
                    try { System.IO.File.Delete(fullPath); } catch { }
                }
            }
            db.Documents.RemoveRange(orphanDocuments);
            await db.SaveChangesAsync(ct);
        }

        return NoContent();
    }
}
