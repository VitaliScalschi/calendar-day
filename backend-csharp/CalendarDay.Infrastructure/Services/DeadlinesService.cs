using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts;
using CalendarDay.Application.Contracts.Deadlines;
using CalendarDay.Application.Contracts.Regulations;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Services;

public class DeadlinesService(CalendarDayDbContext db) : IDeadlinesService
{
    public async Task<PagedResult<DeadlineDto>> GetAsync(DeadlineQuery query, CancellationToken ct)
    {
        var q = db.Deadlines
            .Include(d => d.Election)
            .Include(d => d.Responsibles)
            .Include(d => d.Groups)
            .Include(d => d.Regulations)
            .AsQueryable();

        if (query.ElectionId.HasValue) q = q.Where(d => d.ElectionId == query.ElectionId.Value);
        if (!string.IsNullOrWhiteSpace(query.Group)) q = q.Where(d => d.Groups.Any(g => g.Value == query.Group));
        if (!string.IsNullOrWhiteSpace(query.Responsible)) q = q.Where(d => d.Responsibles.Any(r => r.Value == query.Responsible));
        if (query.From.HasValue) q = q.Where(d => d.DeadlineDate >= query.From.Value);
        if (query.To.HasValue) q = q.Where(d => d.DeadlineDate <= query.To.Value);

        q = query.Sort.Equals("desc", StringComparison.OrdinalIgnoreCase)
            ? q.OrderByDescending(d => d.DeadlineDate)
            : q.OrderBy(d => d.DeadlineDate);

        var totalCount = await q.CountAsync(ct);
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<DeadlineDto>(items.Select(Map).ToList(), page, pageSize, totalCount);
    }

    public async Task<DeadlineDto?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.Deadlines
            .Include(d => d.Election)
            .Include(d => d.Responsibles)
            .Include(d => d.Groups)
            .Include(d => d.Regulations)
            .FirstOrDefaultAsync(d => d.Id == id, ct);
        return entity is null ? null : Map(entity);
    }

    public async Task<DeadlineDto> CreateAsync(CreateDeadlineDto dto, CancellationToken ct)
    {
        var electionExists = await db.Elections.AnyAsync(e => e.Id == dto.ElectionId, ct);
        if (!electionExists)
        {
            throw new ArgumentException("ElectionId is invalid.");
        }

        var entity = new Deadline
        {
            Id = Guid.NewGuid(),
            ElectionId = dto.ElectionId,
            Title = dto.Title.Trim(),
            AdditionalInfo = dto.AdditionalInfo,
            DeadlineDate = dto.Deadline,
            Description = dto.Description.Trim(),
            Responsibles = dto.Responsible.Select(x => new DeadlineResponsible { Id = Guid.NewGuid(), Value = x.Trim() }).ToList(),
            Groups = dto.Group.Select(x => new DeadlineGroup { Id = Guid.NewGuid(), Value = x.Trim() }).ToList(),
        };

        db.Deadlines.Add(entity);
        await db.SaveChangesAsync(ct);
        return (await GetByIdAsync(entity.Id, ct))!;
    }

    public async Task<DeadlineDto?> UpdateAsync(Guid id, UpdateDeadlineDto dto, CancellationToken ct)
    {
        var electionExists = await db.Elections.AnyAsync(e => e.Id == dto.ElectionId, ct);
        if (!electionExists)
        {
            throw new ArgumentException("ElectionId is invalid.");
        }

        var entity = await db.Deadlines.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (entity is null) return null;

        entity.ElectionId = dto.ElectionId;
        entity.Title = dto.Title.Trim();
        entity.AdditionalInfo = dto.AdditionalInfo;
        entity.DeadlineDate = dto.Deadline;
        entity.Description = dto.Description.Trim();
        entity.UpdatedAtUtc = DateTime.UtcNow;

        await db.DeadlineResponsibles.Where(x => x.DeadlineId == entity.Id).ExecuteDeleteAsync(ct);
        await db.DeadlineGroups.Where(x => x.DeadlineId == entity.Id).ExecuteDeleteAsync(ct);
        db.DeadlineResponsibles.AddRange(
            dto.Responsible.Select(x => new DeadlineResponsible
            {
                Id = Guid.NewGuid(),
                DeadlineId = entity.Id,
                Value = x.Trim()
            })
        );
        db.DeadlineGroups.AddRange(
            dto.Group.Select(x => new DeadlineGroup
            {
                Id = Guid.NewGuid(),
                DeadlineId = entity.Id,
                Value = x.Trim()
            })
        );

        await db.SaveChangesAsync(ct);
        return await GetByIdAsync(entity.Id, ct);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.Deadlines.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (entity is null) return false;
        db.Deadlines.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IReadOnlyList<DeadlinesByElectionDto>> GroupedByElectionAsync(CancellationToken ct)
    {
        var elections = await db.Elections
            .Include(e => e.Deadlines)
            .ThenInclude(d => d.Responsibles)
            .Include(e => e.Deadlines)
            .ThenInclude(d => d.Groups)
            .Include(e => e.Deadlines)
            .ThenInclude(d => d.Regulations)
            .OrderBy(e => e.Eday)
            .ToListAsync(ct);

        return elections.Select(e => new DeadlinesByElectionDto(
            e.Id,
            e.Title,
            e.Deadlines
                .OrderBy(d => d.DeadlineDate)
                .Select(d => new DeadlineDto(
                    d.Id,
                    e.Id,
                    e.Title,
                    d.Title,
                    d.AdditionalInfo,
                    d.DeadlineDate,
                    d.Description,
                    d.Responsibles.Select(x => x.Value).ToList(),
                    d.Groups.Select(x => x.Value).ToList(),
                    d.Regulations.Select(r => new RegulationDto(r.Id, d.Id, r.Title, r.Link)).ToList()))
                .ToList()))
            .ToList();
    }

    public async Task<IReadOnlyList<DeadlineDto>> UpcomingAsync(int days, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var limit = today.AddDays(Math.Max(days, 1));
        var items = await db.Deadlines
            .Include(d => d.Election)
            .Include(d => d.Responsibles)
            .Include(d => d.Groups)
            .Include(d => d.Regulations)
            .Where(d => d.DeadlineDate >= today && d.DeadlineDate <= limit)
            .OrderBy(d => d.DeadlineDate)
            .ToListAsync(ct);
        return items.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<DeadlineDto>> OverdueAsync(CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var items = await db.Deadlines
            .Include(d => d.Election)
            .Include(d => d.Responsibles)
            .Include(d => d.Groups)
            .Include(d => d.Regulations)
            .Where(d => d.DeadlineDate < today)
            .OrderByDescending(d => d.DeadlineDate)
            .ToListAsync(ct);
        return items.Select(Map).ToList();
    }

    private static DeadlineDto Map(Deadline d) =>
        new(
            d.Id,
            d.ElectionId,
            d.Election.Title,
            d.Title,
            d.AdditionalInfo,
            d.DeadlineDate,
            d.Description,
            d.Responsibles.Select(x => x.Value).ToList(),
            d.Groups.Select(x => x.Value).ToList(),
            d.Regulations.Select(r => new RegulationDto(r.Id, d.Id, r.Title, r.Link)).ToList()
        );
}
