import type { ButtonHTMLAttributes } from "react";
import { useTheme } from "@/shared/lib/theme";
import { useAppLanguage } from "@/shared/lib/language";
import { cx } from "@/shared/lib/cx";
import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  className?: string;
}

function SunSvg() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.2" fill="currentColor" fillOpacity="0.25" />
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="6.7" y2="6.7" />
      <line x1="17.3" y1="17.3" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="6.7" y2="17.3" />
      <line x1="17.3" y1="6.7" x2="19.07" y2="4.93" />
    </svg>
  );
}

function MoonSvg() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <circle cx="18.5" cy="5.2" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="2.8" r="0.65" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Nút chuyển đổi Theme (Sáng / Tối) với hiệu ứng animation:
 * - Khi chuyển sang Tối: Màn sáng thu trọn về nút nhấn.
 * - Khi chuyển sang Sáng: Màn sáng bung toả từ nút nhấn ra toàn màn hình.
 * - Icon bên trong nút xoay chuyển và co giãn mượt mà.
 */
export function ThemeToggle({ className, ...rest }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const { t } = useAppLanguage();
  const isDark = theme === "dark";

  const label = isDark
    ? t("topbar.themeToggleLight", "Switch to light mode")
    : t("topbar.themeToggleDark", "Switch to dark mode");

  return (
    <button
      type="button"
      data-theme-toggle="true"
      aria-label={label}
      title={label}
      onClick={(e) => toggle(e)}
      className={cx(styles.toggleBtn, className)}
      {...rest}
    >
      <span className={styles.iconContainer} aria-hidden="true">
        <span className={styles.sunIcon}>
          <SunSvg />
        </span>
        <span className={styles.moonIcon}>
          <MoonSvg />
        </span>
      </span>
      <span className={styles.haloRing} aria-hidden="true" />
    </button>
  );
}
