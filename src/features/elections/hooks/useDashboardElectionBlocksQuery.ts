import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import { fetchDashboardElectionBlocks } from '../services/electionService';

export function useDashboardElectionBlocksQuery() {
  return useQuery({
    queryKey: queryKeys.elections.dashboardBlocks(),
    queryFn: ({ signal }) => fetchDashboardElectionBlocks(signal),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}
