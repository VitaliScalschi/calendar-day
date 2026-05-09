import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import { createAudience, deleteAudience, fetchAudiences, reorderAudiences, updateAudience } from '../services/audienceService';

export function useAudiencesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.audiences.list(),
    queryFn: ({ signal }) => fetchAudiences(signal),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

export function useCreateAudienceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAudience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audiences.list() });
    },
  });
}

export function useUpdateAudienceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateAudience(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audiences.list() });
    },
  });
}

export function useReorderAudiencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderAudiences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audiences.list() });
    },
  });
}

export function useDeleteAudienceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAudience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audiences.list() });
    },
  });
}
