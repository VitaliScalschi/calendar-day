using CalendarDay.Application.Contracts.Regulations;

namespace CalendarDay.Application.Abstractions;

public interface IRegulationsService
{
    Task<RegulationDto> CreateAsync(CreateRegulationDto dto, CancellationToken ct);
    Task<RegulationDto?> UpdateAsync(Guid id, UpdateRegulationDto dto, CancellationToken ct);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
