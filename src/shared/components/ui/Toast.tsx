import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cx } from "@/shared/lib/cx";
import { Icon } from "./Icon";
import styles from "./Toast.module.css";

export type ToastTone = "ok" | "warn" | "danger" | "info";

const ICONS: Record<ToastTone, string> = { ok: "checkCircle", warn: "alert", danger: "xCircle", info: "info" };
const DURATION_MS = 4200;

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

// Toast thông báo lưu thành công ở góc dưới bên phải: trang không nhảy, tự biến mất sau ~4 giây.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "ok") => {
      const id = nextId.current++;
      setItems((list) => [...list.slice(-2), { id, message, tone }]);
      timers.current.set(id, window.setTimeout(() => dismiss(id), DURATION_MS));
    },
    [dismiss],
  );

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((t) => window.clearTimeout(t));
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.stack} aria-live="polite">
        {items.map((t) => (
          <div key={t.id} role="status" className={cx(styles.toast, styles[t.tone])}>
            <span className={styles.icon}>
              <Icon name={ICONS[t.tone]} size={16} />
            </span>
            <span className={styles.text}>{t.message}</span>
            <button type="button" className={styles.close} onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
