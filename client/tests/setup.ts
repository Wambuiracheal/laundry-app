import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, vi } from "vitest";
import { resetFakeAuth } from "./supabaseMock";

// No real Supabase in tests: sign-in goes through the fake in supabaseMock.ts.
vi.mock("@/utils/supabaseClient", async () => {
  const { fakeAuth } = await import("./supabaseMock");
  return {
    getSupabase: () => ({ auth: fakeAuth }),
    currentAccessToken: async () => (await fakeAuth.getSession()).data.session?.access_token ?? null,
  };
});

// Vite resolves static image imports to plain URLs, which next/image rejects; render a bare <img>.
vi.mock("next/image", () => ({
  default: ({ src, alt, className }: Record<string, unknown>) =>
    createElement("img", { alt, className, src: typeof src === "string" ? src : (src as { src?: string })?.src }),
}));

afterEach(() => {
  vi.restoreAllMocks();
  resetFakeAuth();
  // Node-environment tests (e.g. proxy) have no DOM to reset.
  if (typeof document !== "undefined") {
    cleanup();
    localStorage.clear();
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
    });
  }
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
