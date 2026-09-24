"use client";

import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import type { Session } from "@/utils/session";

export function displayName(session: Session | null) {
  const name = session?.fullName?.trim() || session?.email?.split("@")[0] || "";
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
}

function initials(session: Session | null) {
  const name = displayName(session);
  if (!name) return "PL";
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || name.slice(0, 2).toUpperCase();
}

export function UserAvatar({ className = "h-8 w-8 text-[11px]" }: { className?: string }) {
  const session = useSession();
  return (
    <Link
      href="/profile"
      aria-label="Your profile"
      className={`inline-flex items-center justify-center rounded-full bg-blue-600 font-semibold text-white transition hover:bg-blue-700 ${className}`}
    >
      {initials(session)}
    </Link>
  );
}

/** First name of the signed-in user, e.g. for "Hello, Jane!". */
export function FirstName({ fallback = "there" }: { fallback?: string }) {
  const session = useSession();
  return <>{displayName(session).split(/\s+/)[0] || fallback}</>;
}
