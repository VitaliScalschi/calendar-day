import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import { fetchGroupedDeadlines, fetchInactiveElections } from '../services/electionService';

export function useHistoryArchiveQuery() {
  return useQuery({
    queryKey: ['history', 'archive'],
    queryFn: async ({ signal }) => {
      const [elections, grouped] = await Promise.all([fetchInactiveElections(signal), fetchGroupedDeadlines(signal)]);
      return { elections, grouped };
    },
    staleTime: 45_000,
    gcTime: 10 * 60_000,
  });
}

export { queryKeys };
