import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import { deleteElection, deleteUser, fetchAdminPanelData, upsertElection, upsertUser } from '../services/adminService';

type UpsertElectionPayload = { title: string; isActive: boolean; eday: string; electionTypeIds: number[] };

export function useAdminPanelQuery(includeUsers = true) {
  return useQuery({
    queryKey: queryKeys.admin.panel(includeUsers),
    queryFn: ({ signal }) => fetchAdminPanelData({ includeUsers, signal }),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.panel(true) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.panel(false) });
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.dashboardBlocks() });
    },
  });
}

export function useDeleteElectionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (electionId: string) => deleteElection(electionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.panel(true) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.panel(false) });
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.dashboardBlocks() });
    },
  });
}

export function useUpsertUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, userId }: { payload: { email: string; password?: string; role: string; isActive: boolean }; userId?: string }) =>
      upsertUser(payload, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.panel(true) });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.panel(true) });
    },
  });
}
