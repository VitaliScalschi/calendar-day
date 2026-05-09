import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import {
  createResponsibleOption,
  deleteResponsibleOption,
  fetchResponsibleOptions,
  reorderResponsibleOptions,
  updateResponsibleOption,
} from '../services/responsibleOptionsService';

export function useResponsibleOptionsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.responsibleOptions.list(),
    queryFn: ({ signal }) => fetchResponsibleOptions(signal),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

export function useCreateResponsibleOptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createResponsibleOption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.responsibleOptions.list() });
    },
  });
}

export function useUpdateResponsibleOptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) => updateResponsibleOption(id, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.responsibleOptions.list() });
    },
  });
}

export function useReorderResponsibleOptionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderResponsibleOptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.responsibleOptions.list() });
    },
  });
}

export function useDeleteResponsibleOptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResponsibleOption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.responsibleOptions.list() });
    },
  });
}
