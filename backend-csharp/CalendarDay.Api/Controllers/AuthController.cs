using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Auth;
using CalendarDay.Infrastructure.Services.SiaAdmin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace CalendarDay.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService, IOptions<SiaAdminOptions> siaOptions) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto dto, CancellationToken ct)
    {
        var response = await authService.LoginAsync(dto, ct);
        return response is null ? Unauthorized(new { message = "Invalid credentials" }) : Ok(response);
    }

    [AllowAnonymous]
    [HttpPost("sia-exchange")]
    public async Task<ActionResult<LoginResponseDto>> SiaExchange([FromBody] SiaSessionExchangeRequestDto? dto, CancellationToken ct)
    {
        var sessionToken = dto?.SessionToken;
        if (string.IsNullOrWhiteSpace(sessionToken))
        {
            var cookieName = (siaOptions.Value.SessionCookieName ?? "SAISE.Token").Trim();
            if (cookieName.Length > 0)
            {
                sessionToken = Request.Cookies[cookieName];
            }
        }

        var response = await authService.ExchangeSiaSessionAsync(sessionToken ?? string.Empty, ct);
        return response is null ? Unauthorized(new { message = "Invalid or expired SIA session" }) : Ok(response);
    }
}
