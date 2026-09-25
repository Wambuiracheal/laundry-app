"use client";

import { useSyncExternalStore } from "react";
import { parseSession, readSessionSnapshot, subscribeToSession } from "@/utils/session";

export function useSession() {
  const snapshot = useSyncExternalStore(subscribeToSession, readSessionSnapshot, () => null);
  return parseSession(snapshot);
}
