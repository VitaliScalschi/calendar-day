using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Regulations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace CalendarDay.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/regulations")]
public class RegulationsController(IRegulationsService service) : ControllerBase
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
        return Ok(new
        {
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
        => await service.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
