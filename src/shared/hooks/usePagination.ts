import { useMemo } from 'react';

type UsePaginationOptions<T> = {
  items: T[];
  page: number;
  pageSize: number;
};

export function usePagination<T>({ items, page, pageSize }: UsePaginationOptions<T>) {
  return useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const offset = (safePage - 1) * pageSize;
    const pageItems = items.slice(offset, offset + pageSize);

    return {
      totalItems: items.length,
      totalPages,
      safePage,
      pageItems,
      from: items.length === 0 ? 0 : offset + 1,
      to: Math.min(offset + pageSize, items.length),
    };
  }, [items, page, pageSize]);
}
