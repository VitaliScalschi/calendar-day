using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Regulations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CalendarDay.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/regulations")]
public class RegulationsController(IRegulationsService service) : ControllerBase
{
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
