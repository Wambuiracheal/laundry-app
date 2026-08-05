"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/shared/auth/AuthProvider";

export function RequireAuth({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return null;
  }

  return <>{children}</>;
}
