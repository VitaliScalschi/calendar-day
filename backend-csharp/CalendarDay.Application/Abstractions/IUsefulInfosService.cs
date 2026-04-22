using CalendarDay.Application.Contracts.UsefulInfos;

namespace CalendarDay.Application.Abstractions;

public interface IUsefulInfosService
{
    Task<IReadOnlyList<UsefulInfoDto>> GetAllAsync(CancellationToken ct);
    Task<IReadOnlyList<UsefulInfoDto>> GetActiveAsync(CancellationToken ct);
    Task<UsefulInfoDto?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<UsefulInfoDto> CreateAsync(CreateUsefulInfoDto dto, CancellationToken ct);
    Task<UsefulInfoDto?> UpdateAsync(Guid id, UpdateUsefulInfoDto dto, CancellationToken ct);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
}
