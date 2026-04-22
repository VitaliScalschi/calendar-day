using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Elections;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace CalendarDay.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/elections")]
public class ElectionsController(IElectionsService service) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ElectionDto>>> GetAll(CancellationToken ct)
        => Ok(await service.GetAllAsync(ct));

    [AllowAnonymous]
    [HttpGet("inactive")]
    public async Task<ActionResult<IReadOnlyList<ElectionDto>>> GetInactive(CancellationToken ct)
        => Ok(await service.GetInactiveAsync(ct));

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ElectionDto>> GetById(Guid id, CancellationToken ct)
    {
        var election = await service.GetByIdAsync(id, ct);
        return election is null ? NotFound() : Ok(election);
    }

    [Authorize(Roles = "SuperAdmin,Editor")]
    [HttpPost]
    public async Task<ActionResult<ElectionDto>> Create([FromBody] CreateElectionDto dto, CancellationToken ct)
    {
        var created = await service.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Roles = "SuperAdmin,Editor")]
    [HttpPost("{id:guid}/upload-document")]
    public async Task<ActionResult<object>> UploadDocument(Guid id, [FromForm] IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "Fișierul este obligatoriu." });
        }

        var election = await service.GetByIdAsync(id, ct);
        if (election is null) return NotFound();

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".pdf")
        {
            return BadRequest(new { message = "Este permis doar fișier PDF." });
        }

        var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "elections");
        Directory.CreateDirectory(uploadDir);

        var fileName = $"{id}.pdf";
        var fullPath = Path.Combine(uploadDir, fileName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream, ct);
        }

        var relativeUrl = $"/uploads/elections/{fileName}";
        return Ok(new
        {
            url = relativeUrl,
            originalName = file.FileName
        });
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}/download-document")]
    public async Task<IActionResult> DownloadDocument(Guid id, CancellationToken ct)
    {
        var election = await service.GetByIdAsync(id, ct);
        if (election is null) return NotFound();

        var fileName = $"{id}.pdf";
        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "elections", fileName);
        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound();
        }

        return PhysicalFile(fullPath, "application/pdf", $"{election.Title}.pdf");
    }

    [Authorize(Roles = "SuperAdmin,Editor")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ElectionDto>> Update(Guid id, [FromBody] UpdateElectionDto dto, CancellationToken ct)
    {
        var updated = await service.UpdateAsync(id, dto, ct);
        return updated is null ? NotFound() : Ok(updated);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => await service.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
