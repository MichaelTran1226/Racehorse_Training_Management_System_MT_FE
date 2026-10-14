// Mã trạng thái (enum) → nhãn tiếng Anh + tông màu của Badge. Mọi Badge trạng thái đều đọc từ đây.

import type { AccountStatus } from "@/shared/types/auth";
import type { HealthStatus, TrainingLockScope, TrainingPlanStatus } from "@/shared/types/enums";

export type BadgeTone = "ok" | "warn" | "danger" | "info" | "neutral" | "violet" | "brand";

export const HEALTH_STATUS: Record<HealthStatus, { label: string; tone: BadgeTone; icon: string }> = {
  ACTIVE: { label: "Ready to Race", tone: "ok", icon: "checkCircle" },
  FIT: { label: "Fit", tone: "ok", icon: "checkCircle" },
  IN_TRAINING: { label: "In Training", tone: "brand", icon: "activity" },
  UNDER_OBSERVATION: { label: "Under Observation", tone: "warn", icon: "eye" },
  INJURED: { label: "Injured", tone: "danger", icon: "alert" },
  ISOLATED: { label: "Isolated", tone: "violet", icon: "shield" },
  QUARANTINED: { label: "Quarantined", tone: "violet", icon: "shield" },
  RESTING: { label: "Resting", tone: "neutral", icon: "clock" },
  RETIRED: { label: "Retired", tone: "neutral", icon: "archive" },
};

export const PLAN_STATUS: Record<TrainingPlanStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  APPROVED: { label: "Approved", tone: "info" },
  ACTIVE: { label: "Active", tone: "ok" },
  PAUSED: { label: "Paused", tone: "warn" },
  COMPLETED: { label: "Completed", tone: "info" },
  SUSPENDED: { label: "Suspended", tone: "danger" },
};

export const LOCK_SCOPE: Record<TrainingLockScope, string> = {
  FULL: "Full lock",
  HIGH_INTENSITY_ONLY: "High-intensity only",
};

// ---------------------------------------------------------------- Trạng thái tài khoản

export const ACCOUNT_STATUS: Record<AccountStatus, { label: string; tone: BadgeTone }> = {
  PENDING_EMAIL: { label: "Email not verified", tone: "warn" },
  PENDING_APPROVAL: { label: "Pending Approval", tone: "warn" },
  INVITED: { label: "Invited", tone: "info" },
  ACTIVE: { label: "Active", tone: "ok" },
  INACTIVE: { label: "Deactivated", tone: "neutral" },
  REJECTED: { label: "Rejected", tone: "danger" },
  LOCKED: { label: "Locked", tone: "danger" },
};

export type AccountTab = "ALL" | "ACTIVE" | "INACTIVE" | "PENDING" | "LOCKED";

// Tab "Pending" gom mọi loại chờ xử lý.
export function tabOf(status: AccountStatus): AccountTab {
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "LOCKED") return "LOCKED";
  if (status === "INACTIVE") return "INACTIVE";
  if (status === "PENDING_EMAIL" || status === "PENDING_APPROVAL" || status === "INVITED") {
    return "PENDING";
  }
  return "ALL";
}
