import { cx } from "@/shared/lib/cx";
import { initials } from "@/shared/lib/format";
import styles from "./Avatar.module.css";

interface AvatarProps {
  name: string;
  size?: number;
  tone?: "brand" | "neutral";
}

export function Avatar({ name, size = 36, tone = "brand" }: AvatarProps) {
  return (
    <span
      title={name}
      className={cx(styles.avatar, styles[tone])}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.3) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
