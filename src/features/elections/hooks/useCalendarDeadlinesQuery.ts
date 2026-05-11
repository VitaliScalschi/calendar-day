import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import { fetchGroupedDeadlinesForCalendar } from '../services/electionService';

export function useCalendarDeadlinesQuery() {
  return useQuery({
    queryKey: queryKeys.calendar.groupedDeadlines(),
    queryFn: ({ signal }) => fetchGroupedDeadlinesForCalendar(signal),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}
