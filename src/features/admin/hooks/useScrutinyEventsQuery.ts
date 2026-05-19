import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import { fetchScrutinyEventsData, type FetchScrutinyEventsParams } from '../services/scrutinyEventsService';

export function useScrutinyEventsQuery(scrutinyId: string | undefined, params: FetchScrutinyEventsParams) {
  return useQuery({
    queryKey: scrutinyId
      ? [
          ...queryKeys.admin.scrutinyEvents(scrutinyId),
          { page: params.fetchAll ? 'all' : params.page, pageSize: params.pageSize, fetchAll: Boolean(params.fetchAll) },
        ]
      : ['admin', 'scrutinyEvents', 'missing'],
    queryFn: ({ signal }) => fetchScrutinyEventsData(scrutinyId as string, params, signal),
    enabled: Boolean(scrutinyId),
    staleTime: 15_000,
    gcTime: 10 * 60_000,
  });
}
