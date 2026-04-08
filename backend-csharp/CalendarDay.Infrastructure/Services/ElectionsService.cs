using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Elections;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Services;

public class ElectionsService(CalendarDayDbContext db) : IElectionsService
{
    public async Task<IReadOnlyList<ElectionDto>> GetAllAsync(CancellationToken ct)
    {
        return await db.Elections
            .OrderBy(e => e.Eday)
            .Select(e => new ElectionDto(e.Id, e.Title, e.IsActive, e.Eday))
            .ToListAsync(ct);
    }

    public async Task<ElectionDto?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await db.Elections
            .Where(e => e.Id == id)
            .Select(e => new ElectionDto(e.Id, e.Title, e.IsActive, e.Eday))
            .FirstOrDefaultAsync(ct);
    }

    public async Task<ElectionDto> CreateAsync(CreateElectionDto dto, CancellationToken ct)
    {
        var entity = new Election
        {
            Id = Guid.NewGuid(),
            Title = dto.Title.Trim(),
            IsActive = dto.IsActive,
            Eday = dto.Eday,
        };

        db.Elections.Add(entity);
        await db.SaveChangesAsync(ct);
        return new ElectionDto(entity.Id, entity.Title, entity.IsActive, entity.Eday);
    }

    public async Task<ElectionDto?> UpdateAsync(Guid id, UpdateElectionDto dto, CancellationToken ct)
    {
        var entity = await db.Elections.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (entity is null) return null;

        entity.Title = dto.Title.Trim();
        entity.IsActive = dto.IsActive;
        entity.Eday = dto.Eday;
        entity.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return new ElectionDto(entity.Id, entity.Title, entity.IsActive, entity.Eday);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.Elections.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (entity is null) return false;

        db.Elections.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
