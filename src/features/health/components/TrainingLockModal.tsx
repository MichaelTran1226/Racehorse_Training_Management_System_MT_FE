import { useState } from "react";
import type { FormEvent } from "react";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";

const APPLIED_STATUS_OPTIONS = [
  { value: "INJURED", label: "Chấn thương (Injured)" },
  { value: "UNDER_OBSERVATION", label: "Cần theo dõi (Under Observation)" },
  { value: "QUARANTINED", label: "Cách ly (Quarantined)" },
];

const RESTORE_STATUS_OPTIONS = [
  { value: "FIT", label: "Đủ điều kiện (Fit) - Cho phép tập luyện lại" },
  { value: "UNDER_OBSERVATION", label: "Cần theo dõi (Under Observation) - Chỉ tập nhẹ" },
];

interface TrainingLockModalProps {
  mode: "place" | "lift" | "extend";
  horseName: string;
  currentReviewDate?: string;
  onClose: () => void;
  onPlaceLock?: (dto: { reason: string; reviewDate: string; appliedStatus: string; unlockConditions?: string }) => Promise<void>;
  onLiftLock?: (dto: { reason: string; restoreStatus: string }) => Promise<void>;
  onExtendLock?: (dto: { newReviewDate: string; reason: string }) => Promise<void>;
}

export function TrainingLockModal({
  mode,
  horseName,
  currentReviewDate,
  onClose,
  onPlaceLock,
  onLiftLock,
  onExtendLock,
}: TrainingLockModalProps) {
  const [reason, setReason] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("INJURED");
  const [reviewDate, setReviewDate] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  );
  const [newReviewDate, setNewReviewDate] = useState(() =>
    currentReviewDate
      ? new Date(new Date(currentReviewDate).getTime() + 7 * 86400000).toISOString().split("T")[0]
      : new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
  );
  const [restoreStatus, setRestoreStatus] = useState("FIT");
  const [unlockConditions, setUnlockConditions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titles = {
    place: `Đặt Khóa huấn luyện: ${horseName} (DL-3.01)`,
    lift: `Gỡ Khóa huấn luyện: ${horseName} (DL-3.02)`,
    extend: `Gia hạn ngày xem xét khóa: ${horseName} (DL-3.03)`,
  };

  const subtitles = {
    place: "Lệnh ưu tiên cao nhất, lập tức chặn xếp lịch tập nặng và đăng ký thi đấu của ngựa.",
    lift: "Gỡ bỏ khóa sau khi ngựa đã bình phục. Các buổi tập bị chặn sẽ chuyển sang chờ HLV khôi phục.",
    extend: "Gia hạn thêm thời gian phục hồi nếu ngựa chưa đạt tiêu chí mở khóa.",
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do thực hiện.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (mode === "place" && onPlaceLock) {
        await onPlaceLock({
          reason: reason.trim(),
          reviewDate,
          appliedStatus,
          unlockConditions: unlockConditions.trim() || undefined,
        });
      } else if (mode === "lift" && onLiftLock) {
        await onLiftLock({
          reason: reason.trim(),
          restoreStatus,
        });
      } else if (mode === "extend" && onExtendLock) {
        await onExtendLock({
          newReviewDate,
          reason: reason.trim(),
        });
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={titles[mode]}
      subtitle={subtitles[mode]}
      tone={mode === "place" ? "danger" : "warn"}
      width={500}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
          <Button tone="ghost" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button
            tone={mode === "lift" ? "primary" : mode === "place" ? "danger" : "primary"}
            onClick={handleSubmit}
            disabled={busy}
          >
            {mode === "place" ? "Xác nhận đặt khóa" : mode === "lift" ? "Xác nhận gỡ khóa" : "Lưu gia hạn"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {error && (
          <div style={{ color: "var(--danger)", fontSize: "13px", padding: "8px", background: "var(--danger-bg)", borderRadius: "4px" }}>
            {error}
          </div>
        )}

        {mode === "place" && (
          <>
            <Field label="Trạng thái sức khỏe áp dụng *">
              <Select
                options={APPLIED_STATUS_OPTIONS}
                value={appliedStatus}
                onChange={(e) => setAppliedStatus(e.target.value)}
              />
            </Field>

            <Field label="Ngày xem xét lại *" hint="Hệ thống sẽ gửi thông báo nhắc VET kiểm tra khi đến ngày này">
              <Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} required />
            </Field>

            <Field label="Lý do khóa huấn luyện *" hint="Tối thiểu 10 ký tự, nêu rõ nguyên nhân y tế">
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Chấn thương cơ đùi sau buổi tập, nghi ngờ rách vi sợi..."
                required
              />
            </Field>

            <Field label="Điều kiện dỡ bỏ khóa" hint="Tiêu chí để xem xét gỡ">
              <Input
                value={unlockConditions}
                onChange={(e) => setUnlockConditions(e.target.value)}
                placeholder="VD: Hết đau khi vận động, có xác nhận siêu âm..."
              />
            </Field>
          </>
        )}

        {mode === "lift" && (
          <>
            <Field label="Trạng thái sức khỏe sau khi gỡ *">
              <Select
                options={RESTORE_STATUS_OPTIONS}
                value={restoreStatus}
                onChange={(e) => setRestoreStatus(e.target.value)}
              />
            </Field>

            <Field label="Lý do gỡ khóa *" hint="Ghi nhận đánh giá thú y trước khi giải phóng ngựa">
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Tái khám ngày hôm nay khớp gối đã hoàn toàn ổn định, biên độ vận động tốt..."
                required
              />
            </Field>
          </>
        )}

        {mode === "extend" && (
          <>
            {currentReviewDate && (
              <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                Ngày xem xét hiện tại: <strong>{new Date(currentReviewDate).toLocaleDateString("vi-VN")}</strong>
              </div>
            )}

            <Field label="Ngày xem xét mới *">
              <Input type="date" value={newReviewDate} onChange={(e) => setNewReviewDate(e.target.value)} required />
            </Field>

            <Field label="Lý do gia hạn *" hint="Nêu lý do ngựa cần thêm thời gian hồi phục">
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Vết thương chưa lành hẳn, cần thêm 7 ngày vật lý trị liệu..."
                required
              />
            </Field>
          </>
        )}
      </form>
    </Modal>
  );
}
