import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/query/queryKeys';
import {
  createUsefulInfoItem,
  deleteUsefulInfoItem,
  fetchUsefulInfoItems,
  type UsefulInfoItem,
  type UsefulInfoType,
  updateUsefulInfoItem,
  uploadUsefulInfoDocument,
} from '../services/usefulInfoService';

type UpsertPayload = {
  title: string;
  slug: string;
  type: UsefulInfoType;
  content: string;
  icon: string;
  status: boolean;
  order: number;
};

export function useUsefulInfoListQuery(activeOnly = false) {
  return useQuery({
    queryKey: queryKeys.usefulInfo.list(activeOnly),
    queryFn: () => fetchUsefulInfoItems(activeOnly),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
  });
}

export function useCreateUsefulInfoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertPayload) => createUsefulInfoItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usefulInfo.all });
    },
  });
}

export function useUpdateUsefulInfoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpsertPayload }) => updateUsefulInfoItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usefulInfo.all });
    },
  });
}

export function useDeleteUsefulInfoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUsefulInfoItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usefulInfo.all });
    },
  });
}

export function useUploadUsefulInfoDocumentMutation() {
  return useMutation({
    mutationFn: (file: File) => uploadUsefulInfoDocument(file),
  });
}

export function useOptimisticReorderUsefulInfoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: UsefulInfoItem[]) => {
      await Promise.all(
        items.map((item) =>
          updateUsefulInfoItem(item.id, {
            title: item.title,
            slug: item.slug,
            type: item.type,
            content: '',
            icon: '',
            status: item.status,
            order: item.order,
          }),
        ),
      );
      return items;
    },
    onMutate: async (nextItems) => {
      const key = queryKeys.usefulInfo.list(false);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<UsefulInfoItem[]>(key);
      queryClient.setQueryData(key, nextItems);
      return { previous, key };
    },
    onError: (_error, _next, context) => {
      if (context?.previous && context.key) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usefulInfo.all });
    },
  });
}
