import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, vi } from "vitest";

// Vite resolves static image imports to plain URLs, which next/image rejects; render a bare <img>.
vi.mock("next/image", () => ({
  default: ({ src, alt, className }: Record<string, unknown>) =>
    createElement("img", { alt, className, src: typeof src === "string" ? src : (src as { src?: string })?.src }),
}));

afterEach(() => {
  vi.restoreAllMocks();
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
