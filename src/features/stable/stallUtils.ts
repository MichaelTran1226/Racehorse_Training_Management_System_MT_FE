import { useMemo } from "react";
import type { Stall } from "./types";
import type { AllocationRef } from "./components/StallDialogs";

/** Màu nền ô theo trạng thái ngựa (Flow 1 §4.1). */
export const HORSE_STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  RESTING: { bg: "var(--slate-bg)", fg: "var(--slate)" },
  IN_TRAINING: { bg: "var(--brand-50)", fg: "var(--brand-600)" },
  ACTIVE: { bg: "var(--ok-bg)", fg: "var(--ok)" },
  UNDER_OBSERVATION: { bg: "var(--warn-bg)", fg: "var(--warn)" },
  INJURED: { bg: "var(--danger-bg)", fg: "var(--danger)" },
  ISOLATED: { bg: "var(--violet-bg)", fg: "var(--violet)" },
};

/** Ô đang có ngựa -> dữ liệu cho Chuyển / Trả ô. */
export function allocationOf(stall: Stall): AllocationRef | null {
  const a = stall.allocations.find((x) => x.isActive);
  return a ? { allocationId: a.id, horseName: a.horse.name, stallId: stall.id, stallCode: stall.code } : null;
}

export function useStallCounts(stalls: Stall[]) {
  return useMemo(
    () => ({
      total: stalls.length,
      occupied: stalls.filter((s) => s.allocations.length > 0).length,
      free: stalls.filter((s) => s.status === "AVAILABLE" && s.allocations.length === 0).length,
      maintenance: stalls.filter((s) => s.status === "MAINTENANCE").length,
    }),
    [stalls],
  );
}
