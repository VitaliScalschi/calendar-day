using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Elections;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
