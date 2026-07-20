"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastApi = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const TOAST_DURATION_MS = 3500;

function toastStyles(variant: ToastVariant): string {
  if (variant === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (variant === "error") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  return "border-slate-200 bg-white text-slate-800";
}

export function ToastProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((variant: ToastVariant, message: string) => {
    const id = crypto.randomUUID();

    setToasts((prev) => [...prev, { id, message, variant }]);

    setTimeout(() => {
      removeToast(id);
    }, TOAST_DURATION_MS);
  }, [removeToast]);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message: string) => showToast("success", message),
      error: (message: string) => showToast("error", message),
      info: (message: string) => showToast("info", message),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[1000] flex w-[92vw] max-w-sm flex-col gap-2 sm:w-auto">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-md ${toastStyles(item.variant)}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <p>{item.message}</p>
              <button
                type="button"
                className="text-xs font-semibold opacity-70 transition hover:opacity-100"
                onClick={() => removeToast(item.id)}
                aria-label="Dismiss notification"
              >
                Close
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
