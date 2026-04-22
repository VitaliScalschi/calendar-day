using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.UsefulInfos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace CalendarDay.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/useful-infos")]
public class UsefulInfosController(IUsefulInfosService service) : ControllerBase
{
    [Authorize(Roles = "SuperAdmin,Editor")]
    [HttpPost("upload-document")]
    public async Task<ActionResult<object>> UploadDocument([FromForm] IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "File is required." });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new[] { ".pdf", ".doc", ".docx" };
        if (!allowed.Contains(extension))
        {
            return BadRequest(new { message = "Only pdf, doc and docx files are allowed." });
        }

        var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "useful-info");
        Directory.CreateDirectory(uploadDir);

        var safeFileName = $"{Guid.NewGuid()}{extension}";
        var fullPath = Path.Combine(uploadDir, safeFileName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream, ct);
        }

        var relativeUrl = $"/uploads/useful-info/{safeFileName}";
        return Ok(new { url = relativeUrl, originalName = file.FileName });
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UsefulInfoDto>>> GetAll([FromQuery] bool activeOnly = false, CancellationToken ct = default)
        => Ok(activeOnly ? await service.GetActiveAsync(ct) : await service.GetAllAsync(ct));

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UsefulInfoDto>> GetById(Guid id, CancellationToken ct)
    {
        var item = await service.GetByIdAsync(id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id, CancellationToken ct)
    {
        var item = await service.GetByIdAsync(id, ct);
        if (item is null || item.Type != "document" || string.IsNullOrWhiteSpace(item.Slug))
        {
            return NotFound();
        }

        var fileName = Path.GetFileName(item.Slug);
        var physicalPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "useful-info", fileName);
        if (!System.IO.File.Exists(physicalPath))
        {
            return NotFound();
        }

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var contentType = extension switch
        {
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            _ => "application/octet-stream"
        };

        return PhysicalFile(physicalPath, contentType, fileName);
    }

    [Authorize(Roles = "SuperAdmin,Editor")]
    [HttpPost]
    public async Task<ActionResult<UsefulInfoDto>> Create([FromBody] CreateUsefulInfoDto dto, CancellationToken ct)
    {
        var created = await service.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Roles = "SuperAdmin,Editor")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UsefulInfoDto>> Update(Guid id, [FromBody] UpdateUsefulInfoDto dto, CancellationToken ct)
    {
        var updated = await service.UpdateAsync(id, dto, ct);
        return updated is null ? NotFound() : Ok(updated);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var existing = await service.GetByIdAsync(id, ct);
        if (existing is null) return NotFound();

        var deleted = await service.DeleteAsync(id, ct);
        if (!deleted) return NotFound();

        if (existing.Type == "document" && !string.IsNullOrWhiteSpace(existing.Slug))
        {
            var fileName = Path.GetFileName(existing.Slug);
            var physicalPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "useful-info", fileName);
            if (System.IO.File.Exists(physicalPath))
            {
                try
                {
                    System.IO.File.Delete(physicalPath);
                }
                catch
                {
                    // Do not fail delete API when file cleanup fails.
                }
            }
        }

        return NoContent();
    }
}
