import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import { fetchCurrentUser } from '../services/currentUserService';

export function useCurrentUserQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.currentUser.me(),
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}
