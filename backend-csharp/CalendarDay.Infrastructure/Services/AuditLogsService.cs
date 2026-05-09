using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts;
using CalendarDay.Application.Contracts.AuditLogs;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Services;

public class AuditLogsService(CalendarDayDbContext db) : IAuditLogsService
{
    public async Task<PagedResult<AuditLogDto>> GetAsync(AuditLogQuery query, CancellationToken ct)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 200);

        IQueryable<AuditLog> q = db.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLowerInvariant();
            q = q.Where(x =>
                (x.Username ?? string.Empty).ToLower().Contains(search) ||
                x.Action.ToLower().Contains(search) ||
                (x.Details ?? string.Empty).ToLower().Contains(search) ||
                x.Endpoint.ToLower().Contains(search) ||
                x.Method.ToLower().Contains(search));
        }

        if (!string.IsNullOrWhiteSpace(query.User))
        {
            var user = query.User.Trim().ToLowerInvariant();
            q = q.Where(x => (x.Username ?? string.Empty).ToLower().Contains(user));
        }
        if (!string.IsNullOrWhiteSpace(query.Action))
        {
            var action = query.Action.Trim().ToLowerInvariant();
            q = q.Where(x => x.Action.ToLower().Contains(action));
        }
        if (!string.IsNullOrWhiteSpace(query.Endpoint))
        {
            var endpoint = query.Endpoint.Trim().ToLowerInvariant();
            q = q.Where(x => x.Endpoint.ToLower().Contains(endpoint));
        }
        if (query.StatusCode.HasValue)
        {
            q = q.Where(x => x.StatusCode == query.StatusCode.Value);
        }
        if (query.FromUtc.HasValue)
        {
            q = q.Where(x => x.CreatedAtUtc >= query.FromUtc.Value);
        }
        if (query.ToUtc.HasValue)
        {
            q = q.Where(x => x.CreatedAtUtc <= query.ToUtc.Value);
        }

        var sortBy = query.SortBy.Trim().ToLowerInvariant();
        var sortAsc = query.SortDir.Trim().Equals("asc", StringComparison.OrdinalIgnoreCase);
        q = (sortBy, sortAsc) switch
        {
            ("status", true) => q.OrderBy(x => x.StatusCode).ThenBy(x => x.CreatedAtUtc),
            ("status", false) => q.OrderByDescending(x => x.StatusCode).ThenByDescending(x => x.CreatedAtUtc),
            ("user", true) => q.OrderBy(x => x.Username).ThenBy(x => x.CreatedAtUtc),
            ("user", false) => q.OrderByDescending(x => x.Username).ThenByDescending(x => x.CreatedAtUtc),
            ("action", true) => q.OrderBy(x => x.Action).ThenBy(x => x.CreatedAtUtc),
            ("action", false) => q.OrderByDescending(x => x.Action).ThenByDescending(x => x.CreatedAtUtc),
            _ when sortAsc => q.OrderBy(x => x.CreatedAtUtc),
            _ => q.OrderByDescending(x => x.CreatedAtUtc),
        };

        var totalCount = await q.CountAsync(ct);
        var items = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AuditLogDto(
                x.Id,
                x.Username,
                x.Action,
                x.Details,
                x.Endpoint,
                x.Method,
                x.StatusCode,
                x.IpAddress,
                x.CreatedAtUtc))
            .ToListAsync(ct);

        return new PagedResult<AuditLogDto>(items, page, pageSize, totalCount);
    }

    public async Task LogAsync(string? username, string action, string? details, string endpoint, string method, int statusCode, string? ipAddress, CancellationToken ct)
    {
        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            Username = string.IsNullOrWhiteSpace(username) ? null : username.Trim().ToLowerInvariant(),
            Action = action.Trim(),
            Details = string.IsNullOrWhiteSpace(details) ? null : details.Trim(),
            Endpoint = endpoint.Trim(),
            Method = method.Trim().ToUpperInvariant(),
            StatusCode = statusCode,
            IpAddress = ipAddress,
            CreatedAtUtc = DateTime.UtcNow,
        };
        db.AuditLogs.Add(log);
        await db.SaveChangesAsync(ct);
    }
}
