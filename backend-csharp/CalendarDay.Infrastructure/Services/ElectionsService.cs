using CalendarDay.Application.Abstractions;
using CalendarDay.Application.Contracts.Elections;
using CalendarDay.Domain.Entities;
using CalendarDay.Infrastructure.Files;
using CalendarDay.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CalendarDay.Infrastructure.Services;

public class ElectionsService(CalendarDayDbContext db) : IElectionsService
{
    private static bool HasDocument(Election election)
    {
        if (string.IsNullOrWhiteSpace(election.DocumentStoredName)) return false;
        var path = ElectionDocumentFiles.FindDocumentPath(election.Id);
        return path is not null && File.Exists(path);
    }

    private static (string? Name, string? Url, long? SizeBytes) GetDocumentMeta(Election election)
    {
        var path = ElectionDocumentFiles.FindDocumentPath(election.Id);
        if (path is null || !File.Exists(path))
        {
            return (null, null, null);
        }
        var size = election.DocumentSizeBytes ?? new FileInfo(path).Length;
        return (
            string.IsNullOrWhiteSpace(election.DocumentOriginalName) ? Path.GetFileName(path) : election.DocumentOriginalName,
            $"/api/elections/{election.Id}/download-document",
            size
        );
    }

    private static IReadOnlyList<int> TypeIdsSnapshot(Election e) =>
        e.ElectionTypeIds is { Count: > 0 } list ? list : Array.Empty<int>();

    private async Task<List<int>> NormalizeElectionTypeIdsAsync(IReadOnlyList<int>? ids, CancellationToken ct)
    {
        if (ids is null || ids.Count == 0)
            return [];
        var unique = ids.Distinct().ToList();
        return await db.ElectionTypes
            .AsNoTracking()
            .Where(t => unique.Contains(t.Id))
            .OrderBy(t => t.Id)
            .Select(t => t.Id)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ElectionDto>> GetAllAsync(CancellationToken ct)
    {
        var elections = await db.Elections
            .Where(e => e.IsActive)
            .OrderBy(e => e.Eday)
            .ToListAsync(ct);
        return elections.Select(e =>
        {
            var doc = GetDocumentMeta(e);
            return new ElectionDto(e.Id, e.Title, e.IsActive, e.Eday, HasDocument(e), TypeIdsSnapshot(e), doc.Name, doc.Url, doc.SizeBytes);
        }).ToList();
    }

    public async Task<IReadOnlyList<ElectionDto>> GetInactiveAsync(CancellationToken ct)
    {
        var elections = await db.Elections
            .Where(e => !e.IsActive)
            .OrderByDescending(e => e.Eday)
            .ToListAsync(ct);
        return elections.Select(e =>
        {
            var doc = GetDocumentMeta(e);
            return new ElectionDto(e.Id, e.Title, e.IsActive, e.Eday, HasDocument(e), TypeIdsSnapshot(e), doc.Name, doc.Url, doc.SizeBytes);
        }).ToList();
    }

    public async Task<ElectionDto?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var entity = await db.Elections.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (entity is null) return null;
        var doc = GetDocumentMeta(entity);
        return new ElectionDto(entity.Id, entity.Title, entity.IsActive, entity.Eday, HasDocument(entity), TypeIdsSnapshot(entity), doc.Name, doc.Url, doc.SizeBytes);
    }

    public async Task<ElectionDto> CreateAsync(CreateElectionDto dto, CancellationToken ct)
    {
        var typeIds = await NormalizeElectionTypeIdsAsync(dto.ElectionTypeIds, ct);
        var entity = new Election
        {
            Id = Guid.NewGuid(),
            Title = dto.Title.Trim(),
            IsActive = dto.IsActive,
            Eday = dto.Eday,
            ElectionTypeIds = typeIds,
        };

        db.Elections.Add(entity);
        await db.SaveChangesAsync(ct);
        var createdDoc = GetDocumentMeta(entity);
        return new ElectionDto(entity.Id, entity.Title, entity.IsActive, entity.Eday, HasDocument(entity), TypeIdsSnapshot(entity), createdDoc.Name, createdDoc.Url, createdDoc.SizeBytes);
    }

    public async Task<ElectionDto?> UpdateAsync(Guid id, UpdateElectionDto dto, CancellationToken ct)
    {
        var entity = await db.Elections.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (entity is null) return null;

        entity.Title = dto.Title.Trim();
        entity.IsActive = dto.IsActive;
        entity.Eday = dto.Eday;
        entity.ElectionTypeIds = await NormalizeElectionTypeIdsAsync(dto.ElectionTypeIds, ct);
        entity.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        var updatedDoc = GetDocumentMeta(entity);
        return new ElectionDto(entity.Id, entity.Title, entity.IsActive, entity.Eday, HasDocument(entity), TypeIdsSnapshot(entity), updatedDoc.Name, updatedDoc.Url, updatedDoc.SizeBytes);
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
