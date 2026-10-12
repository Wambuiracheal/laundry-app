"use client";

import { useEffect, useState } from "react";

/** Current time in ms, refreshed every `intervalMs`, so time-based labels (e.g. "overdue") stay current. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}
