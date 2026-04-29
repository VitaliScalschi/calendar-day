import { useMemo } from 'react';

export function useFilters<T>(items: T[], predicate: (item: T) => boolean) {
  return useMemo(() => items.filter(predicate), [items, predicate]);
}
