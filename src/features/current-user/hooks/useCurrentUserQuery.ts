import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import { fetchCurrentUser } from '../services/currentUserService';

export function useCurrentUserQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.currentUser.me(),
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    enabled,
    /** Profilul (inclusiv subdiviziunea) trebuie actualizat la fiecare intrare în dashboard; global `refetchOnMount: false` altfel lasă date vechi după login. */
    staleTime: 60_000,
    gcTime: 15 * 60_000,
    refetchOnMount: 'always',
  });
}
