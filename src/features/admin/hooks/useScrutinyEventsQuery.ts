import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import { fetchScrutinyEventsData } from '../services/scrutinyEventsService';

export function useScrutinyEventsQuery(scrutinyId?: string) {
  return useQuery({
    queryKey: scrutinyId ? queryKeys.admin.scrutinyEvents(scrutinyId) : ['admin', 'scrutinyEvents', 'missing'],
    queryFn: ({ signal }) => fetchScrutinyEventsData(scrutinyId as string, signal),
    enabled: Boolean(scrutinyId),
    staleTime: 15_000,
    gcTime: 10 * 60_000,
  });
}
