"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AuthLayout } from "@/components/shared/AuthLayout";
import { FormStatusMessage } from "@/components/shared/form/FormField";
import { useRouteAfterSignIn } from "@/components/shared/useFinishSignIn";
import { exchangeCodeFromUrl, finishSignIn } from "@/utils/authApi";

/** Where social logins and email confirmation links land: starts the session, then moves on. */
export default function AuthCallbackPage() {
  const routeAfterSignIn = useRouteAfterSignIn();
  const [error, setError] = useState<string | null>(null);
  // A code can only be exchanged once; Strict Mode runs effects twice in development.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const role = params.get("role") === "rider" ? "rider" : undefined;
    exchangeCodeFromUrl(params)
      .then(async (linkError) => {
        if (linkError) {
          setError(linkError);
          return;
        }
        routeAfterSignIn(await finishSignIn(role), params.get("next"), role);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Couldn't finish signing in."));
  }, [routeAfterSignIn]);

  return (
    <AuthLayout title={error ? "Couldn't sign you in" : "Signing you in…"} subtitle={error ? "The link may have expired." : "This only takes a moment."}>
      {error ? (
        <div className="space-y-4">
          <FormStatusMessage message={error} tone="error" />
          <div className="flex gap-4 text-sm font-medium">
            <Link href="/login" className="text-blue-700 hover:text-blue-800">
              Back to login
            </Link>
            <Link href="/register" className="text-blue-700 hover:text-blue-800">
              Create an account
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Please wait…</p>
      )}
    </AuthLayout>
  );
}
