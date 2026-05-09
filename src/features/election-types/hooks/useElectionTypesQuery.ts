import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import { createElectionType, deleteElectionType, fetchElectionTypes, reorderElectionTypes, updateElectionType } from '../services/electionTypesService';

export function useElectionTypesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.electionTypes.list(),
    queryFn: ({ signal }) => fetchElectionTypes(signal),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

export function useCreateElectionTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createElectionType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.electionTypes.list() });
    },
  });
}

export function useUpdateElectionTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateElectionType(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.electionTypes.list() });
    },
  });
}

export function useReorderElectionTypesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderElectionTypes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.electionTypes.list() });
    },
  });
}

export function useDeleteElectionTypeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteElectionType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.electionTypes.list() });
    },
  });
}
