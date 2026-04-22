using CalendarDay.Application.Contracts.Elections;

namespace CalendarDay.Application.Abstractions;

public interface IElectionsService
{
    Task<IReadOnlyList<ElectionDto>> GetAllAsync(CancellationToken ct);
    Task<IReadOnlyList<ElectionDto>> GetInactiveAsync(CancellationToken ct);
    Task<ElectionDto?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<ElectionDto> CreateAsync(CreateElectionDto dto, CancellationToken ct);
    Task<ElectionDto?> UpdateAsync(Guid id, UpdateElectionDto dto, CancellationToken ct);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
