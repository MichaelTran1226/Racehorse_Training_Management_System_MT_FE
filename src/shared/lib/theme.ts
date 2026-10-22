import { useEffect, useState } from "react";

// Theme sáng/tối. Token dark nằm ở tokens.css dưới [data-theme="dark"].
// Lần tải đầu, script inline trong index.html đã set data-theme trước khi React chạy
// (tránh chớp trắng) — phải giữ STORAGE_KEY và cách chọn khớp với script đó.
export type Theme = "light" | "dark";

const STORAGE_KEY = "equiflow-theme";
const OS_DARK = "(prefers-color-scheme: dark)";

interface ViewTransition {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => Promise<void> | void) => ViewTransition;
};

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function osTheme(): Theme {
  return window.matchMedia(OS_DARK).matches ? "dark" : "light";
}

export function getCurrentTheme(): Theme {
  const currentAttr = document.documentElement.dataset.theme;
  if (currentAttr === "light" || currentAttr === "dark") {
    return currentAttr;
  }
  return readStored() ?? osTheme();
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

// Global subscribers để mọi component dùng useTheme() đồng bộ ngay lập tức
const listeners = new Set<(theme: Theme) => void>();

function notifyAll(nextTheme: Theme) {
  listeners.forEach((fn) => {
    try {
      fn(nextTheme);
    } catch {
      // ignore
    }
  });
}

let isTransitioning = false;

/**
 * Lấy toạ độ tâm của nút bấm để làm tâm bung toả / thu về cho hiệu ứng clip-path.
 */
function resolveOrigin(
  event?: React.MouseEvent | MouseEvent | { clientX: number; clientY: number },
): { x: number; y: number } {
  if (
    event &&
    "clientX" in event &&
    typeof event.clientX === "number" &&
    (event.clientX > 0 || event.clientY > 0)
  ) {
    return { x: event.clientX, y: event.clientY };
  }

  const btn = document.querySelector<HTMLElement>("[data-theme-toggle]");
  if (btn) {
    const rect = btn.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  // Fallback góc trên bên phải thanh Topbar
  return {
    x: window.innerWidth - 60,
    y: 32,
  };
}

/**
 * Chuyển đổi Theme có kèm Animation tròn:
 * - Sáng -> Tối: Màn sáng (old view) thu trọn về vị trí nút nhấn.
 * - Tối -> Sáng: Màn sáng (new view) bung toả từ nút nhấn ra toàn màn hình.
 */
export async function toggleTheme(
  event?: React.MouseEvent | MouseEvent | { clientX: number; clientY: number },
): Promise<void> {
  if (isTransitioning) return;

  const currentTheme = getCurrentTheme();
  const nextTheme: Theme = currentTheme === "dark" ? "light" : "dark";

  try {
    localStorage.setItem(STORAGE_KEY, nextTheme);
  } catch {
    // Trình duyệt chặn storage: vẫn đổi theme cho phiên hiện tại.
  }

  // Nếu người dùng bật cấu hình giảm chuyển động (reduced-motion): đổi tức thì
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    apply(nextTheme);
    notifyAll(nextTheme);
    return;
  }

  const { x, y } = resolveOrigin(event);
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const doc = document as DocumentWithViewTransition;

  // 1. Dùng View Transitions API nếu trình duyệt hỗ trợ (Chrome 111+, Edge 111+, Safari 18+, Firefox 126+)
  if (typeof doc.startViewTransition === "function") {
    isTransitioning = true;
    const direction = nextTheme === "dark" ? "to-dark" : "to-light";
    document.documentElement.dataset.themeTransition = direction;

    try {
      const transition = doc.startViewTransition(() => {
        apply(nextTheme);
        notifyAll(nextTheme);
      });

      await transition.ready;

      if (nextTheme === "dark") {
        // Sáng -> Tối: Màn sáng (old view) thu trọn về nút nhấn (x, y)
        const anim = document.documentElement.animate(
          {
            clipPath: [
              `circle(${endRadius}px at ${x}px ${y}px)`,
              `circle(0px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 600,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            pseudoElement: "::view-transition-old(root)",
          },
        );
        await anim.finished;
      } else {
        // Tối -> Sáng: Màn sáng (new view) bung toả từ nút nhấn (x, y) - điều chỉnh chậm rãi và mượt hơn
        const anim = document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 950,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
        await anim.finished;
      }
    } catch {
      apply(nextTheme);
      notifyAll(nextTheme);
    } finally {
      delete document.documentElement.dataset.themeTransition;
      isTransitioning = false;
    }
    return;
  }

  // 2. Fallback cho trình duyệt chưa hỗ trợ View Transitions API (dùng overlay DOM)
  isTransitioning = true;
  await runDomFallbackTransition(nextTheme, x, y, endRadius, () => {
    apply(nextTheme);
    notifyAll(nextTheme);
  });
  isTransitioning = false;
}

/**
 * Hiệu ứng tương đương qua DOM overlay cho trình duyệt cũ:
 */
function runDomFallbackTransition(
  nextTheme: Theme,
  originX: number,
  originY: number,
  endRadius: number,
  commit: () => void,
): Promise<void> {
  return new Promise<void>((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "999999";
    overlay.style.pointerEvents = "none";
    overlay.style.backgroundColor = "#ffffff";
    document.body.appendChild(overlay);

    if (nextTheme === "dark") {
      // Sáng -> Tối: Đổi nền chính thành dark trước, màn sáng overlay thu về nút
      commit();
      const anim = overlay.animate(
        {
          clipPath: [
            `circle(${endRadius}px at ${originX}px ${originY}px)`,
            `circle(0px at ${originX}px ${originY}px)`,
          ],
        },
        {
          duration: 600,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        },
      );
      anim.onfinish = () => {
        overlay.remove();
        resolve();
      };
    } else {
      // Tối -> Sáng: Màn sáng overlay bung toả từ nút ra toàn màn hình (chậm rãi hơn)
      const anim = overlay.animate(
        {
          clipPath: [
            `circle(0px at ${originX}px ${originY}px)`,
            `circle(${endRadius}px at ${originX}px ${originY}px)`,
          ],
        },
        {
          duration: 950,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
      anim.onfinish = () => {
        commit();
        overlay.remove();
        resolve();
      };
    }
  });
}

// Hook React useTheme
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getCurrentTheme);

  useEffect(() => {
    listeners.add(setTheme);
    return () => {
      listeners.delete(setTheme);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(OS_DARK);
    const onChange = () => {
      if (readStored() === null) {
        const next = osTheme();
        apply(next);
        notifyAll(next);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = (
    event?: React.MouseEvent | MouseEvent | { clientX: number; clientY: number },
  ) => {
    toggleTheme(event);
  };

  return { theme, toggle };
}
