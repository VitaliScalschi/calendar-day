using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Elections;
using CalendarDay.Infrastructure.Files;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace CalendarDay.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/elections")]
public class ElectionsController(IElectionsService service) : ControllerBase
{
    /// <summary>Programe active (<c>IsActive == true</c>) pentru site și calendar.</summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ElectionDto>>> GetAll(CancellationToken ct)
        => Ok(await service.GetAllAsync(ct));

    /// <summary>Programe inactive (<c>IsActive == false</c>) pentru arhivă / pagina History.</summary>
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
        if (!ElectionDocumentFiles.IsAllowedExtension(extension))
        {
            return BadRequest(new
            {
                message = "Sunt permise PDF, Word, Excel sau imagini (JPG, PNG, GIF, WEBP).",
            });
        }

        var uploadDir = ElectionDocumentFiles.GetUploadDirectory();
        Directory.CreateDirectory(uploadDir);

        ElectionDocumentFiles.DeleteAllForElection(id);

        var fileName = $"{id}{extension}";
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

        var fullPath = ElectionDocumentFiles.FindDocumentPath(id);
        if (fullPath is null || !System.IO.File.Exists(fullPath))
        {
            return NotFound();
        }

        var storedExtension = Path.GetExtension(fullPath).ToLowerInvariant();
        var contentType = storedExtension switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream",
        };

        var downloadName = $"{election.Title}{storedExtension}";
        return PhysicalFile(fullPath, contentType, downloadName);
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
