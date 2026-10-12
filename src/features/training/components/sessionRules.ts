import type { ExerciseSession } from "../types";

/** Các nút được hiện cho một buổi tập (bảng nút SC-2.04, dùng chung cho SC-2.05). */
export interface SessionButtons {
  edit: boolean; // BTN-2.20: Đã lên lịch và chưa tới giờ
  cancel: boolean; // BTN-2.21: Đã lên lịch, Bị chặn, Bỏ lỡ
  record: boolean; // BTN-2.22: Đã lên lịch đã tới giờ; Bỏ lỡ trong 7 ngày
  viewResult: boolean; // BTN-2.23: Hoàn thành
  restore: boolean; // BTN-2.24: Bị chặn
  restoreBlockedReason?: string; // vô hiệu hóa khi ngựa vẫn đang khóa
}

const DAY = 24 * 60 * 60 * 1000;

export function sessionButtons(s: ExerciseSession, role: string): SessionButtons {
  const ht = role === "HEAD_TRAINER";
  const planOpen = s.planStatus === undefined || s.planStatus === "DRAFT" || s.planStatus === "ACTIVE";
  const started = new Date(s.scheduledAt).getTime() <= Date.now();
  const missedInTime = s.status === "MISSED" && Date.now() - new Date(s.scheduledAt).getTime() < 8 * DAY;
  return {
    edit: ht && planOpen && s.status === "SCHEDULED" && !started,
    cancel: ht && (s.status === "SCHEDULED" || s.status === "BLOCKED" || s.status === "MISSED"),
    record: ht && ((s.status === "SCHEDULED" && started) || missedInTime),
    viewResult: s.status === "COMPLETED",
    restore: ht && s.status === "BLOCKED",
    restoreBlockedReason: s.isHorseLocked ? "The horse is still under a Training Lock." : undefined,
  };
}
