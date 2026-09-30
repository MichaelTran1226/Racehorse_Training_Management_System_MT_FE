import { useEffect, useState } from "react";

// Theme sáng/tối. Token dark nằm ở tokens.css dưới [data-theme="dark"].
// Lần tải đầu, script inline trong index.html đã set data-theme trước khi React chạy
// (tránh chớp trắng) — phải giữ STORAGE_KEY và cách chọn khớp với script đó.
export type Theme = "light" | "dark";

const STORAGE_KEY = "equiflow-theme";
const OS_DARK = "(prefers-color-scheme: dark)";

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

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

// Chưa chọn thì theo hệ điều hành (và đổi theo khi OS đổi); đã bấm nút thì nhớ lựa chọn.
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readStored() ?? osTheme());

  useEffect(() => {
    apply(theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia(OS_DARK);
    const onChange = () => {
      if (readStored() === null) setTheme(osTheme());
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Trình duyệt chặn storage: vẫn đổi theme cho phiên hiện tại.
    }
    setTheme(next);
  };

  return { theme, toggle };
}
