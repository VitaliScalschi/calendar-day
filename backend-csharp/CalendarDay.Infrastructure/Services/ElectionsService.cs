using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Elections;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace CalendarDay.Infrastructure.Services;

public class ElectionsService(CalendarDayDbContext db) : IElectionsService
{
    private static bool HasDocument(Guid electionId)
    {
        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "elections", $"{electionId}.pdf");
        return File.Exists(filePath);
    }

    public async Task<IReadOnlyList<ElectionDto>> GetAllAsync(CancellationToken ct)
    {
        var elections = await db.Elections
            .OrderBy(e => e.Eday)
            .ToListAsync(ct);
        return elections.Select(e => new ElectionDto(e.Id, e.Title, e.IsActive, e.Eday, HasDocument(e.Id))).ToList();
    }

    public async Task<IReadOnlyList<ElectionDto>> GetInactiveAsync(CancellationToken ct)
    {
        var elections = await db.Elections
            .Where(e => !e.IsActive)
            .OrderByDescending(e => e.Eday)
            .ToListAsync(ct);
        return elections.Select(e => new ElectionDto(e.Id, e.Title, e.IsActive, e.Eday, HasDocument(e.Id))).ToList();
    }

    public async Task<ElectionDto?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.Elections.FirstOrDefaultAsync(e => e.Id == id, ct);
        return entity is null ? null : new ElectionDto(entity.Id, entity.Title, entity.IsActive, entity.Eday, HasDocument(entity.Id));
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
        return new ElectionDto(entity.Id, entity.Title, entity.IsActive, entity.Eday, HasDocument(entity.Id));
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
        return new ElectionDto(entity.Id, entity.Title, entity.IsActive, entity.Eday, HasDocument(entity.Id));
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
