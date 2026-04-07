using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Regulations;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Services;

public class RegulationsService(CalendarDayDbContext db) : IRegulationsService
{
    public async Task<RegulationDto> CreateAsync(CreateRegulationDto dto, CancellationToken ct)
    {
        var entity = new Regulation
        {
            Id = Guid.NewGuid(),
            DeadlineId = dto.DeadlineId,
            Title = dto.Title.Trim(),
            Link = dto.Link.Trim(),
        };

        db.Regulations.Add(entity);
        await db.SaveChangesAsync(ct);
        return new RegulationDto(entity.Id, entity.DeadlineId, entity.Title, entity.Link);
    }

    public async Task<RegulationDto?> UpdateAsync(Guid id, UpdateRegulationDto dto, CancellationToken ct)
    {
        var entity = await db.Regulations.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (entity is null) return null;

        entity.Title = dto.Title.Trim();
        entity.Link = dto.Link.Trim();
        await db.SaveChangesAsync(ct);

        return new RegulationDto(entity.Id, entity.DeadlineId, entity.Title, entity.Link);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.Regulations.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (entity is null) return false;

        db.Regulations.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }
}
