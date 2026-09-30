import { useTheme } from "@/shared/lib/theme";
import { IconButton } from "./IconButton";

// Nút đổi sáng/tối: icon là theme SẼ chuyển sang, nhãn nói rõ hành động.
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <IconButton
      icon={dark ? "sun" : "moon"}
      label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
    />
  );
}
