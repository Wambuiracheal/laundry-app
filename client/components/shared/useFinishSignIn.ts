"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { SignInResult } from "@/utils/authApi";
import type { SignupRole } from "@/utils/roles";
import { postLoginPath } from "@/utils/session";

/** Sends a freshly signed-in user on: to the profile form if their account isn't finished, otherwise onwards. */
export function useRouteAfterSignIn() {
  const router = useRouter();
  return useCallback(
    (result: SignInResult, next: string | null, role?: SignupRole) => {
      if (result.status === "needs_profile") {
        const query = new URLSearchParams();
        if (next) query.set("next", next);
        if (role ?? result.suggested.role) query.set("role", role ?? result.suggested.role);
        router.replace(`/complete-profile?${query}`);
        return;
      }
      router.replace(postLoginPath(next, result.profile.role));
    },
    [router],
  );
}
