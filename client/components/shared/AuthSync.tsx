"use client";

import { useEffect } from "react";
import { clearSession, readSessionSnapshot } from "@/utils/session";
import { getSupabase } from "@/utils/supabaseClient";

/**
 * Keeps the cached profile (and the role cookie the route guard reads) in step with Supabase:
 * cleared when the user signs out in another tab or their session ends, and on load when it's
 * left over without a Supabase session (e.g. from the login system used before Supabase).
 */
export function AuthSync() {
  useEffect(() => {
    let supabase;
    try {
      supabase = getSupabase();
    } catch {
      return undefined; // Sign-in isn't configured; nothing to keep in sync.
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session && readSessionSnapshot()) clearSession();
    });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") clearSession();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return null;
}
