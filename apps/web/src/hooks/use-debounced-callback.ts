import { useEffect, useMemo, useRef } from 'react';

export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number,
): (...args: TArgs) => void {
  const cbRef = useRef(callback);
  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  return useMemo(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (...args: TArgs) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        cbRef.current(...args);
      }, delayMs);
    };
  }, [delayMs]);
}
