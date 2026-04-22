using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.UsefulInfos;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Services;

public class UsefulInfosService(CalendarDayDbContext db) : IUsefulInfosService
{
    public async Task<IReadOnlyList<UsefulInfoDto>> GetAllAsync(CancellationToken ct)
    {
        return await db.UsefulInfos
            .OrderBy(x => x.Order)
            .ThenBy(x => x.Title)
            .Select(MapExpr())
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<UsefulInfoDto>> GetActiveAsync(CancellationToken ct)
    {
        return await db.UsefulInfos
            .Where(x => x.Status)
            .OrderBy(x => x.Order)
            .ThenBy(x => x.Title)
            .Select(MapExpr())
            .ToListAsync(ct);
    }

    public async Task<UsefulInfoDto?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await db.UsefulInfos
            .Where(x => x.Id == id)
            .Select(MapExpr())
            .FirstOrDefaultAsync(ct);
    }

    public async Task<UsefulInfoDto> CreateAsync(CreateUsefulInfoDto dto, CancellationToken ct)
    {
        var entity = new UsefulInfo
        {
            Id = Guid.NewGuid(),
            Title = dto.Title.Trim(),
            Slug = dto.Slug.Trim(),
            Type = dto.Type.Trim(),
            Content = dto.Content.Trim(),
            Icon = dto.Icon.Trim(),
            Status = dto.Status,
            Order = dto.Order,
            UpdatedAtUtc = DateTime.UtcNow
        };

        db.UsefulInfos.Add(entity);
        await db.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task<UsefulInfoDto?> UpdateAsync(Guid id, UpdateUsefulInfoDto dto, CancellationToken ct)
    {
        var entity = await db.UsefulInfos.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return null;

        entity.Title = dto.Title.Trim();
        entity.Slug = dto.Slug.Trim();
        entity.Type = dto.Type.Trim();
        entity.Content = dto.Content.Trim();
        entity.Icon = dto.Icon.Trim();
        entity.Status = dto.Status;
        entity.Order = dto.Order;
        entity.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.UsefulInfos.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return false;

        db.UsefulInfos.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }

    private static UsefulInfoDto Map(UsefulInfo item) =>
        new(
            item.Id,
            item.Title,
            item.Slug,
            item.Type,
            item.Content,
            item.Icon,
            item.Status,
            item.Order,
            item.UpdatedAtUtc
        );

    private static System.Linq.Expressions.Expression<Func<UsefulInfo, UsefulInfoDto>> MapExpr() =>
        item => new UsefulInfoDto(
            item.Id,
            item.Title,
            item.Slug,
            item.Type,
            item.Content,
            item.Icon,
            item.Status,
            item.Order,
            item.UpdatedAtUtc
        );
}
