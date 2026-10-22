"use client";

import { useState } from "react";
import { SOCIAL_PROVIDERS, signInWithProvider, type SocialProvider } from "@/utils/authApi";
import type { SignupRole } from "@/utils/roles";
import { currentNextParam } from "@/utils/session";

const buttonClass =
  "flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60";

function ProviderIcon({ provider }: { provider: SocialProvider }) {
  if (provider === "google") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.5-.2-2.2H12z" />
        <path fill="#34A853" d="M12 22c2.6 0 4.9-.9 6.5-2.5l-3.1-2.4c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1l-3.2 2.5C4.8 19.7 8.1 22 12 22z" />
        <path fill="#4A90E2" d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9l-3.2-2.5C2.4 9.1 2 10.5 2 12s.4 2.9 1.2 4.1l3.2-2.2z" />
        <path fill="#FBBC05" d="M12 6.1c1.4 0 2.7.5 3.6 1.4l2.7-2.7C16.8 3.3 14.6 2.4 12 2.4c-3.9 0-7.2 2.3-8.8 5.6l3.2 2.5c.8-2.5 3-4.4 5.6-4.4z" />
      </svg>
    );
  }
  if (provider === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="#1877F2"
          d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 384 512" className="h-4 w-4" aria-hidden="true">
      <path d="M319.1 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7-55.8 .9-115.1 44.5-115.1 133.2 0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM262.5 104.5c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

/** "Continue with Google / Facebook / Apple". New accounts get the given role (customer by default). */
export function SocialSignInButtons({
  role,
  disabled = false,
  onError,
}: {
  role?: SignupRole;
  disabled?: boolean;
  onError: (message: string) => void;
}) {
  const [pending, setPending] = useState<SocialProvider | null>(null);

  async function start(provider: SocialProvider) {
    try {
      setPending(provider);
      await signInWithProvider(provider, { next: currentNextParam(), role });
      // The browser is now leaving for the provider; keep the button busy until it does.
    } catch (error) {
      setPending(null);
      onError(error instanceof Error ? error.message : "Couldn't start sign-in. Please try again.");
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {SOCIAL_PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          className={buttonClass}
          aria-label={`Continue with ${provider.label}`}
          disabled={disabled || pending !== null}
          onClick={() => start(provider.id)}
        >
          <ProviderIcon provider={provider.id} />
          <span className="max-sm:sr-only">{pending === provider.id ? "…" : provider.label}</span>
        </button>
      ))}
    </div>
  );
}
