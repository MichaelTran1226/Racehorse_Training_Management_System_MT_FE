import type { SVGProps } from "react";
import { iconPaths } from "./icons";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name" | "children"> {
  name: string;
  size?: number;
  strokeWidth?: number;
}

// Icon luôn ẩn với trình đọc màn hình (aria-hidden): nghĩa nằm ở nhãn chữ đi kèm.
export function Icon({ name, size = 16, strokeWidth = 1.8, style, ...rest }: IconProps) {
  const paths = iconPaths[name] ?? iconPaths.info;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0, display: "block", ...style }}
      dangerouslySetInnerHTML={{ __html: paths }}
      {...rest}
    />
  );
}
