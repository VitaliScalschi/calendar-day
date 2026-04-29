using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts;
using CalendarDay.Application.Contracts.Deadlines;
using CalendarDay.Application.Contracts.Regulations;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace CalendarDay.Infrastructure.Services;

public class DeadlinesService(CalendarDayDbContext db) : IDeadlinesService
{
    private const string RangeMetaPrefix = "[[RANGE:";
    private const string IsoDateFormat = "yyyy-MM-dd";

    private static bool IsRangeDeadline(string deadline) => deadline.Contains(" - ", StringComparison.Ordinal);

    private static string MergeAdditionalInfoWithRange(string? additionalInfo, string deadline)
    {
        var cleaned = RemoveRangeMeta(additionalInfo);
        if (!IsRangeDeadline(deadline)) return cleaned;
        var meta = $"{RangeMetaPrefix}{deadline.Trim()}]]";
        return string.IsNullOrWhiteSpace(cleaned) ? meta : $"{cleaned} {meta}";
    }

    private static string RemoveRangeMeta(string? additionalInfo)
    {
        if (string.IsNullOrWhiteSpace(additionalInfo)) return string.Empty;
        var value = additionalInfo.Trim();
        var start = value.IndexOf(RangeMetaPrefix, StringComparison.Ordinal);
        if (start < 0) return value;
        var end = value.IndexOf("]]", start, StringComparison.Ordinal);
        if (end < 0) return value;
        return (value.Remove(start, (end + 2) - start)).Trim();
    }

    private static string ResolveDeadlineDisplay(Deadline deadline)
    {
        if (deadline.Type == Deadline.TypeRange && deadline.StartDate.HasValue && deadline.EndDate.HasValue)
        {
            return $"{deadline.StartDate.Value:dd/MM/yyyy} - {deadline.EndDate.Value:dd/MM/yyyy}";
        }

        if (deadline.Type == Deadline.TypeSingle)
        {
            var singleDate = deadline.StartDate ?? deadline.DeadlineDate;
            return singleDate.ToString(IsoDateFormat, CultureInfo.InvariantCulture);
        }

        var additionalInfo = deadline.AdditionalInfo;
        if (!string.IsNullOrWhiteSpace(additionalInfo))
        {
            var start = additionalInfo.IndexOf(RangeMetaPrefix, StringComparison.Ordinal);
            if (start >= 0)
            {
                var end = additionalInfo.IndexOf("]]", start, StringComparison.Ordinal);
                if (end > start)
                {
                    var rangeValue = additionalInfo.Substring(start + RangeMetaPrefix.Length, end - (start + RangeMetaPrefix.Length)).Trim();
                    if (!string.IsNullOrWhiteSpace(rangeValue))
                        return rangeValue;
                }
            }
        }

        var normalizedDates = NormalizeEventDates(deadline);
        var primaryDate = normalizedDates.Count > 0 ? normalizedDates[0] : deadline.DeadlineDate;
        return primaryDate.ToString(IsoDateFormat, CultureInfo.InvariantCulture);
    }

    private static DateOnly ParseSingleDate(string value)
    {
        var raw = (value ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(raw))
            throw new ArgumentException("Date value is required.");

        if (DateOnly.TryParseExact(raw, "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedRo))
            return parsedRo;

        if (DateOnly.TryParseExact(raw, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedIso))
            return parsedIso;

        if (DateOnly.TryParse(raw, out var parsed))
            return parsed;

        throw new ArgumentException("Deadline format is invalid. Use DD/MM/YYYY or YYYY-MM-DD.");
    }

    private static bool TryParseRange(string raw, out DateOnly start, out DateOnly end)
    {
        start = default;
        end = default;
        var fullRangeMatch = System.Text.RegularExpressions.Regex.Match(raw, @"^(\d{1,2}/\d{1,2}/\d{4}|\d{4}-\d{2}-\d{2})\s*-\s*(\d{1,2}/\d{1,2}/\d{4}|\d{4}-\d{2}-\d{2})$");
        if (!fullRangeMatch.Success)
        {
            return false;
        }

        var parsedStart = ParseSingleDate(fullRangeMatch.Groups[1].Value);
        var parsedEnd = ParseSingleDate(fullRangeMatch.Groups[2].Value);
        start = parsedStart <= parsedEnd ? parsedStart : parsedEnd;
        end = parsedStart <= parsedEnd ? parsedEnd : parsedStart;
        return true;
    }

    private static (string Type, DateOnly? StartDate, DateOnly? EndDate, IReadOnlyList<DateOnly> MultipleDates) ParseInputShape(string deadline, IReadOnlyCollection<string> deadlines)
    {
        if (deadlines.Count > 0)
        {
            var parsedDates = deadlines.Select(ParseSingleDate).Distinct().OrderBy(x => x).ToList();
            return (Deadline.TypeMultiple, null, null, parsedDates);
        }

        var raw = (deadline ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(raw))
            throw new ArgumentException("Deadline is required.");

        if (TryParseRange(raw, out var rangeStart, out var rangeEnd))
        {
            return (Deadline.TypeRange, rangeStart, rangeEnd, []);
        }

        var single = ParseSingleDate(raw);
        return (Deadline.TypeSingle, single, single, []);
    }

    private static List<DateOnly> NormalizeEventDates(Deadline deadline)
    {
        if (deadline.Type == Deadline.TypeRange && deadline.StartDate.HasValue && deadline.EndDate.HasValue)
        {
            var dates = new List<DateOnly>();
            var cursor = deadline.StartDate.Value;
            while (cursor <= deadline.EndDate.Value)
            {
                dates.Add(cursor);
                cursor = cursor.AddDays(1);
            }
            return dates;
        }

        var normalized = deadline.Dates.Select(d => d.EventDate).Distinct().OrderBy(x => x).ToList();
        if (normalized.Count > 0) return normalized;
        if (deadline.StartDate.HasValue) return [deadline.StartDate.Value];
        return [deadline.DeadlineDate];
    }

    private static List<DeadlineDate> BuildDeadlineDateEntities(Guid deadlineId, IEnumerable<DateOnly> dates)
    {
        return dates
            .Distinct()
            .OrderBy(x => x)
            .Select(date => new DeadlineDate
            {
                Id = Guid.NewGuid(),
                DeadlineId = deadlineId,
                EventDate = date,
            })
            .ToList();
    }

    public async Task<PagedResult<DeadlineDto>> GetAsync(DeadlineQuery query, CancellationToken ct)
    {
        var q = db.Deadlines
            .Include(d => d.Election)
            .Include(d => d.Dates)
            .Include(d => d.Responsibles)
            .Include(d => d.Groups)
            .Include(d => d.Regulations)
            .AsQueryable();

        if (query.ElectionId.HasValue) q = q.Where(d => d.ElectionId == query.ElectionId.Value);
        if (!string.IsNullOrWhiteSpace(query.Group)) q = q.Where(d => d.Groups.Any(g => g.Value == query.Group));
        if (!string.IsNullOrWhiteSpace(query.Responsible)) q = q.Where(d => d.Responsibles.Any(r => r.Value == query.Responsible));
        if (query.From.HasValue)
        {
            var from = query.From.Value;
            q = q.Where(d =>
                (d.Type == Deadline.TypeRange && (d.EndDate ?? d.DeadlineDate) >= from) ||
                (d.Type == Deadline.TypeMultiple && d.Dates.Any(x => x.EventDate >= from)) ||
                ((d.Type == Deadline.TypeSingle || string.IsNullOrWhiteSpace(d.Type)) && (d.StartDate ?? d.DeadlineDate) >= from));
        }
        if (query.To.HasValue)
        {
            var to = query.To.Value;
            q = q.Where(d =>
                (d.Type == Deadline.TypeRange && (d.StartDate ?? d.DeadlineDate) <= to) ||
                (d.Type == Deadline.TypeMultiple && d.Dates.Any(x => x.EventDate <= to)) ||
                ((d.Type == Deadline.TypeSingle || string.IsNullOrWhiteSpace(d.Type)) && (d.EndDate ?? d.DeadlineDate) <= to));
        }

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
            .Include(d => d.Dates)
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

        var shape = ParseInputShape(dto.Deadline, dto.Deadlines);
        var normalizedDeadline = shape.Type == Deadline.TypeMultiple && shape.MultipleDates.Count > 0
            ? shape.MultipleDates.Min()
            : (shape.StartDate ?? ParseSingleDate(dto.Deadline));
        var entity = new Deadline
        {
            Id = Guid.NewGuid(),
            ElectionId = dto.ElectionId,
            Title = dto.Title.Trim(),
            AdditionalInfo = shape.Type == Deadline.TypeRange ? MergeAdditionalInfoWithRange(dto.AdditionalInfo, dto.Deadline) : RemoveRangeMeta(dto.AdditionalInfo),
            Type = shape.Type,
            StartDate = shape.StartDate,
            EndDate = shape.EndDate,
            DeadlineDate = normalizedDeadline,
            Description = dto.Description.Trim(),
            Responsibles = dto.Responsible.Select(x => new DeadlineResponsible { Id = Guid.NewGuid(), Value = x.Trim() }).ToList(),
            Groups = dto.Group.Select(x => new DeadlineGroup { Id = Guid.NewGuid(), Value = x.Trim() }).ToList(),
            Dates = BuildDeadlineDateEntities(Guid.Empty, shape.MultipleDates),
        };
        foreach (var date in entity.Dates)
        {
            date.DeadlineId = entity.Id;
        }

        await using var trx = await db.Database.BeginTransactionAsync(ct);
        db.Deadlines.Add(entity);
        await db.SaveChangesAsync(ct);
        await trx.CommitAsync(ct);
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

        var shape = ParseInputShape(dto.Deadline, dto.Deadlines);
        entity.ElectionId = dto.ElectionId;
        entity.Title = dto.Title.Trim();
        entity.AdditionalInfo = shape.Type == Deadline.TypeRange ? MergeAdditionalInfoWithRange(dto.AdditionalInfo, dto.Deadline) : RemoveRangeMeta(dto.AdditionalInfo);
        entity.Type = shape.Type;
        entity.StartDate = shape.StartDate;
        entity.EndDate = shape.EndDate;
        entity.DeadlineDate = shape.Type == Deadline.TypeMultiple && shape.MultipleDates.Count > 0
            ? shape.MultipleDates.Min()
            : (shape.StartDate ?? ParseSingleDate(dto.Deadline));
        entity.Description = dto.Description.Trim();
        entity.UpdatedAtUtc = DateTime.UtcNow;

        await using var trx = await db.Database.BeginTransactionAsync(ct);
        await db.DeadlineDates.Where(x => x.DeadlineId == entity.Id).ExecuteDeleteAsync(ct);
        await db.DeadlineResponsibles.Where(x => x.DeadlineId == entity.Id).ExecuteDeleteAsync(ct);
        await db.DeadlineGroups.Where(x => x.DeadlineId == entity.Id).ExecuteDeleteAsync(ct);
        db.DeadlineDates.AddRange(BuildDeadlineDateEntities(entity.Id, shape.MultipleDates));
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
        await trx.CommitAsync(ct);
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
            .ThenInclude(d => d.Dates)
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
                    RemoveRangeMeta(d.AdditionalInfo),
                    d.Type,
                    d.Type == Deadline.TypeMultiple ? null : (d.StartDate ?? d.DeadlineDate).ToString(IsoDateFormat, CultureInfo.InvariantCulture),
                    d.Type == Deadline.TypeMultiple ? null : (d.EndDate ?? d.DeadlineDate).ToString(IsoDateFormat, CultureInfo.InvariantCulture),
                    NormalizeEventDates(d).Select(x => x.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)).ToList(),
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
        var deadlineIdsWithUpcomingDates = await db.DeadlineDates
            .Where(x => x.EventDate >= today && x.EventDate <= limit)
            .Select(x => x.DeadlineId)
            .Distinct()
            .ToListAsync(ct);
        var items = await db.Deadlines
            .Include(d => d.Election)
            .Include(d => d.Dates)
            .Include(d => d.Responsibles)
            .Include(d => d.Groups)
            .Include(d => d.Regulations)
            .Where(d =>
                deadlineIdsWithUpcomingDates.Contains(d.Id) ||
                (d.Type == Deadline.TypeRange && (d.StartDate ?? d.DeadlineDate) <= limit && (d.EndDate ?? d.DeadlineDate) >= today) ||
                ((d.Type == Deadline.TypeSingle || string.IsNullOrWhiteSpace(d.Type)) && (d.StartDate ?? d.DeadlineDate) >= today && (d.StartDate ?? d.DeadlineDate) <= limit))
            .OrderBy(d => d.DeadlineDate)
            .ToListAsync(ct);
        return items.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<DeadlineDto>> OverdueAsync(CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var deadlineIdsWithOverdueDates = await db.DeadlineDates
            .Where(x => x.EventDate < today)
            .Select(x => x.DeadlineId)
            .Distinct()
            .ToListAsync(ct);
        var items = await db.Deadlines
            .Include(d => d.Election)
            .Include(d => d.Dates)
            .Include(d => d.Responsibles)
            .Include(d => d.Groups)
            .Include(d => d.Regulations)
            .Where(d =>
                deadlineIdsWithOverdueDates.Contains(d.Id) ||
                (d.Type == Deadline.TypeRange && (d.EndDate ?? d.DeadlineDate) < today) ||
                ((d.Type == Deadline.TypeSingle || string.IsNullOrWhiteSpace(d.Type)) && (d.EndDate ?? d.DeadlineDate) < today))
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
            RemoveRangeMeta(d.AdditionalInfo),
            d.Type,
            d.Type == Deadline.TypeMultiple ? null : (d.StartDate ?? d.DeadlineDate).ToString(IsoDateFormat, CultureInfo.InvariantCulture),
            d.Type == Deadline.TypeMultiple ? null : (d.EndDate ?? d.DeadlineDate).ToString(IsoDateFormat, CultureInfo.InvariantCulture),
            NormalizeEventDates(d).Select(x => x.ToString(IsoDateFormat, CultureInfo.InvariantCulture)).ToList(),
            d.Description,
            d.Responsibles.Select(x => x.Value).ToList(),
            d.Groups.Select(x => x.Value).ToList(),
            d.Regulations.Select(r => new RegulationDto(r.Id, d.Id, r.Title, r.Link)).ToList()
        );
}
