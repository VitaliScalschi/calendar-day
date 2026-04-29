import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import { fetchActiveElectionsWithDeadlines } from '../services/electionService';

export function useHomeElectionsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.elections.active(),
    queryFn: ({ signal }) => fetchActiveElectionsWithDeadlines(signal),
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}
