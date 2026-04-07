using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts;
using CalendarDay.Application.Contracts.Deadlines;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CalendarDay.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/deadlines")]
public class DeadlinesController(IDeadlinesService service) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<PagedResult<DeadlineDto>>> Get([FromQuery] DeadlineQuery query, CancellationToken ct)
        => Ok(await service.GetAsync(query, ct));

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<DeadlineDto>> GetById(Guid id, CancellationToken ct)
    {
        var deadline = await service.GetByIdAsync(id, ct);
        return deadline is null ? NotFound() : Ok(deadline);
    }

    [AllowAnonymous]
    [HttpGet("grouped-by-election")]
    public async Task<ActionResult<IReadOnlyList<DeadlinesByElectionDto>>> Grouped(CancellationToken ct)
        => Ok(await service.GroupedByElectionAsync(ct));

    [AllowAnonymous]
    [HttpGet("upcoming")]
    public async Task<ActionResult<IReadOnlyList<DeadlineDto>>> Upcoming([FromQuery] int days = 7, CancellationToken ct = default)
        => Ok(await service.UpcomingAsync(days, ct));

    [AllowAnonymous]
    [HttpGet("overdue")]
    public async Task<ActionResult<IReadOnlyList<DeadlineDto>>> Overdue(CancellationToken ct)
        => Ok(await service.OverdueAsync(ct));

    [Authorize(Roles = "SuperAdmin,Editor")]
    [HttpPost]
    public async Task<ActionResult<DeadlineDto>> Create([FromBody] CreateDeadlineDto dto, CancellationToken ct)
    {
        try
        {
            var created = await service.CreateAsync(dto, ct);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = "SuperAdmin,Editor")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<DeadlineDto>> Update(Guid id, [FromBody] UpdateDeadlineDto dto, CancellationToken ct)
    {
        try
        {
            var updated = await service.UpdateAsync(id, dto, ct);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => await service.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
