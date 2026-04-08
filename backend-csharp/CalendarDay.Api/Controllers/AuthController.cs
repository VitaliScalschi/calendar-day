using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CalendarDay.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto dto, CancellationToken ct)
    {
        var response = await authService.LoginAsync(dto, ct);
        return response is null ? Unauthorized(new { message = "Invalid credentials" }) : Ok(response);
    }
}
