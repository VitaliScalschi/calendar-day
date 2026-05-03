import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import { fetchElectionTypes } from '../services/electionTypesService';

export function useElectionTypesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.electionTypes.list(),
    queryFn: ({ signal }) => fetchElectionTypes(signal),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}
