using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CalendarDay.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController(IUsersService service) : ControllerBase
{
    [Authorize(Roles = "SuperAdmin")]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> GetAll(CancellationToken ct)
        => Ok(await service.GetAllAsync(ct));

    [Authorize(Roles = "SuperAdmin")]
    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto dto, CancellationToken ct)
    {
        var created = await service.CreateAsync(dto, ct);
        return Ok(created);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserDto>> Update(Guid id, [FromBody] UpdateUserDto dto, CancellationToken ct)
    {
        var updated = await service.UpdateAsync(id, dto, ct);
        return updated is null ? NotFound() : Ok(updated);
    }

    [Authorize(Roles = "SuperAdmin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        => await service.DeleteAsync(id, ct) ? NoContent() : NotFound();
}
