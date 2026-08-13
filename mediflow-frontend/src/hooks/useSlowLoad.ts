import { useEffect, useState } from 'react';

/**
 * Returns true once `isLoading` has been true for longer than `delayMs`.
 * Used to distinguish a normal request from one stuck behind a slow
 * connection or a free-tier backend waking up from sleep, so the UI can
 * say something honest instead of spinning silently.
 */
export function useSlowLoad(isLoading: boolean, delayMs = 4000): boolean {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsSlow(false);
      return;
    }
    const timer = setTimeout(() => setIsSlow(true), delayMs);
    return () => clearTimeout(timer);
  }, [isLoading, delayMs]);

  return isSlow;
}
