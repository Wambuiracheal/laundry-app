"use client";

import { useEffect, useState } from "react";

/**
 * Loads data on mount and re-fetches every `intervalMs` while the tab is visible, so
 * changes made elsewhere (e.g. the shop weighing an order) show up without a reload.
 * `load` should be stable (a module-level function), or it re-subscribes on every render.
 */
export function usePolledData<T>(load: () => Promise<T>, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = () =>
      load().then(
        (next) => {
          if (cancelled) return;
          setData(next);
          setError(null);
        },
        (err: unknown) => {
          if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong.");
        },
      );

    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, intervalMs]);

  return { data, error, loading: data === null && error === null, setData };
}
