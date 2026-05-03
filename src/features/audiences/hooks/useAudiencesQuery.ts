import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import { fetchAudiences } from '../services/audienceService';

export function useAudiencesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.audiences.list(),
    queryFn: ({ signal }) => fetchAudiences(signal),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}
