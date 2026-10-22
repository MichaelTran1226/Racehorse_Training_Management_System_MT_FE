import { createContext, useContext } from "react";

export type ToastTone = "ok" | "warn" | "danger" | "info";

// Nút hành động trong toast, ví dụ "Undo" sau khi xóa hồ sơ ngựa.
export interface ToastOptions {
  action?: { label: string; onClick: () => void };
  durationMs?: number;
}

export interface ToastApi {
  show: (message: string, tone?: ToastTone, options?: ToastOptions) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
