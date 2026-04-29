import { useCallback, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const rawValue = localStorage.getItem(key);
      if (rawValue === null) {
        return initialValue;
      }
      return JSON.parse(rawValue) as T;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (nextValue: T | ((currentValue: T) => T)) => {
      setStoredValue((currentValue) => {
        const valueToStore = typeof nextValue === 'function' ? (nextValue as (value: T) => T)(currentValue) : nextValue;
        try {
          localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch {
          // ignore storage write failures
        }
        return valueToStore;
      });
    },
    [key],
  );

  return [storedValue, setValue] as const;
}
