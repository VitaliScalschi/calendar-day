using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.SiaAdmin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CalendarDay.Api.Controllers;

[Authorize(Policy = "AdminOnly")]
[ApiController]
[Route("api/sia-admin")]
public class SiaAdminController(ISiaAdminService siaAdminService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<SiaSessionInfoDto>> Login([FromBody] SiaLoginRequestDto request, CancellationToken ct)
    {
        var response = await siaAdminService.LoginAsync(request, ct);
        return response is null ? Unauthorized(new { message = "Login failed for SIA Admin service." }) : Ok(response);
    }

    [HttpGet("session-info")]
    public async Task<ActionResult<SiaSessionInfoDto>> GetSessionInfo([FromQuery] string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest(new { message = "Token is required." });
        }

        var response = await siaAdminService.GetSessionInfoAsync(token, ct);
        return response is null ? NotFound() : Ok(response);
    }

    [HttpGet("is-valid-token")]
    public async Task<ActionResult<bool>> IsValidToken([FromQuery] string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest(new { message = "Token is required." });
        }

        var isValid = await siaAdminService.IsValidTokenAsync(token, ct);
        return Ok(isValid);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] SiaTokenRequestDto request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.SessionToken))
        {
            return BadRequest(new { message = "SessionToken is required." });
        }

        await siaAdminService.LogoutAsync(request.SessionToken, ct);
        return NoContent();
    }
}
