using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts;
using CalendarDay.Application.Contracts.AuditLogs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CalendarDay.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/audit-logs")]
public class AuditLogsController(IAuditLogsService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResult<AuditLogDto>>> Get([FromQuery] AuditLogQuery query, CancellationToken ct)
        => Ok(await service.GetAsync(query, ct));
}
