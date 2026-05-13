import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import {
  createSubdivision,
  deleteSubdivision,
  fetchSubdivisions,
  updateSubdivision,
  type UpsertSubdivisionPayload,
} from '../services/subdivisionService';

export function useSubdivisionsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.subdivisions.list(),
    queryFn: ({ signal }) => fetchSubdivisions(signal),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

export function useCreateSubdivisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubdivision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subdivisions.list() });
    },
  });
}

export function useUpdateSubdivisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertSubdivisionPayload }) =>
      updateSubdivision(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subdivisions.list() });
    },
  });
}

export function useDeleteSubdivisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubdivision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subdivisions.list() });
    },
  });
}
