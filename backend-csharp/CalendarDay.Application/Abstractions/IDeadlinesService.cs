using CalendarDay.Application.Contracts;
using CalendarDay.Application.Contracts.Deadlines;

namespace CalendarDay.Application.Abstractions;

public interface IDeadlinesService
{
    Task<PagedResult<DeadlineDto>> GetAsync(DeadlineQuery query, CancellationToken ct);
    Task<DeadlineDto?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<DeadlineDto> CreateAsync(CreateDeadlineDto dto, CancellationToken ct);
    Task<DeadlineDto?> UpdateAsync(Guid id, UpdateDeadlineDto dto, CancellationToken ct);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<DeadlinesByElectionDto>> GroupedByElectionAsync(CancellationToken ct);
    Task<IReadOnlyList<DeadlineDto>> UpcomingAsync(int days, CancellationToken ct);
    Task<IReadOnlyList<DeadlineDto>> OverdueAsync(CancellationToken ct);
}
