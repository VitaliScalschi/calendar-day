import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import { deleteElection, deleteUser, fetchAdminPanelData, upsertElection, upsertUser } from '../services/adminService';

type UpsertElectionPayload = { title: string; isActive: boolean; eday: string; electionTypeIds: number[] };

export function useAdminPanelQuery() {
  return useQuery({
    queryKey: queryKeys.admin.panel(),
    queryFn: ({ signal }) => fetchAdminPanelData(signal),
    staleTime: 20_000,
    gcTime: 10 * 60_000,
  });
}

export function useUpsertElectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, electionId, document }: { payload: { title: string; isActive: boolean; eday: string }; electionId?: string; document?: File | null }) =>
      upsertElection(payload, electionId, document),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.panel() });
    },
  });
}

export function useDeleteElectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (electionId: string) => deleteElection(electionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.panel() });
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.all });
    },
  });
}

export function useUpsertUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, userId }: { payload: { email: string; password?: string; role: string; isActive: boolean }; userId?: string }) =>
      upsertUser(payload, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.panel() });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.panel() });
    },
  });
}
