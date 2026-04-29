import { useEffect, useState } from 'react';
import { ApiError } from '../services/apiClient';

type UseFetchOptions<T> = {
  enabled?: boolean;
  initialData?: T;
};

export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>, options: UseFetchOptions<T> = {}) {
  const { enabled = true, initialData } = options;
  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher(controller.signal);
        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (caughtError) {
        if (!controller.signal.aborted) {
          setError(caughtError instanceof ApiError ? caughtError : new ApiError(500, 'Unexpected error while loading data.'));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    run();
    return () => controller.abort();
  }, [enabled, fetcher]);

  return { data, error, loading, setData };
}
