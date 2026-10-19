import { useCallback, useEffect, useRef, useState } from "react";

interface RemoteState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Loads data with a stale-response guard (the last request wins). Previous
 * data stays available while a refetch is in flight so lists don't flash empty.
 * Re-runs whenever `deps` change or `refresh()` is called.
 */
export function useRemoteData<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown>,
): RemoteState<T> & { refresh: () => void } {
  const [state, setState] = useState<RemoteState<T>>({
    data: null,
    error: null,
    loading: true,
  });
  const [tick, setTick] = useState(0);
  const requestRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const requestId = ++requestRef.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcherRef
      .current()
      .then((data) => {
        if (requestId === requestRef.current) {
          setState({ data, error: null, loading: false });
        }
      })
      .catch((err: unknown) => {
        if (requestId === requestRef.current) {
          setState((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : "Something went wrong.",
          }));
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller-supplied deps
  }, [...deps, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, refresh };
}
