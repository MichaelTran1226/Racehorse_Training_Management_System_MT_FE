import type { ReactNode } from "react";
import { LOCK_SCOPE } from "@/shared/lib/status";
import type { TrainingLockScope } from "@/shared/types/enums";
import { Icon } from "./Icon";
import styles from "./LockBanner.module.css";

interface LockBannerProps {
  horseName?: string;
  reason: string;
  lockedBy?: string;
  lockedAt?: string;
  until?: string;
  scope?: TrainingLockScope;
  action?: ReactNode; // ví dụ nút "Ask to lift the lock"
}

// Dải cảnh báo đỏ "ngựa đang bị khóa huấn luyện". Dùng ở giáo án, lịch tập và hồ sơ ngựa (Training Lock, luồng 3 và 4).
export function LockBanner({ horseName, reason, lockedBy, lockedAt, until, scope, action }: LockBannerProps) {
  const rows: [string, string][] = [];
  if (lockedBy) rows.push(["Locked by", lockedBy]);
  if (lockedAt) rows.push(["Locked at", lockedAt]);
  if (until) rows.push(["Until", until]);
  if (scope) rows.push(["Scope", LOCK_SCOPE[scope]]);

  return (
    <div role="alert" className={styles.banner}>
      <span className={styles.icon}>
        <Icon name="lock" size={17} />
      </span>
      <div className={styles.body}>
        <strong className={styles.title}>
          {horseName ? `${horseName} is locked from training` : "This horse is locked from training"}
        </strong>
        <p className={styles.reason}>{reason}</p>
        {rows.length > 0 && (
          <div className={styles.rows}>
            {rows.map(([label, value]) => (
              <div key={label} className={styles.row}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
