import { useState } from "react";
import type { FormEvent } from "react";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Textarea } from "@/shared/components/form/Textarea";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import type { FinalizeRecordInput } from "../types";

interface FinalizeRecordModalProps {
  recordNumber: string;
  proposedStatus?: string;
  initialProposeLock?: boolean;
  onClose: () => void;
  onFinalize: (input: FinalizeRecordInput) => Promise<void>;
}

export function FinalizeRecordModal({
  recordNumber,
  proposedStatus,
  initialProposeLock = false,
  onClose,
  onFinalize,
}: FinalizeRecordModalProps) {
  const [applyProposedStatus, setApplyProposedStatus] = useState(true);
  const [proposeMedicalLock, setProposeMedicalLock] = useState(initialProposeLock);
  const [lockExpectedRestDays, setLockExpectedRestDays] = useState(7);
  const [lockReason, setLockReason] = useState("");
  const [lockUnlockConditions, setLockUnlockConditions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (proposeMedicalLock && !lockReason.trim()) {
      setError("Vui lòng nhập lý do đặt Khóa huấn luyện.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onFinalize({
        applyProposedStatus,
        proposeMedicalLock,
        lockExpectedRestDays: proposeMedicalLock ? Number(lockExpectedRestDays) : undefined,
        lockReason: proposeMedicalLock ? lockReason.trim() : undefined,
        lockUnlockConditions: proposeMedicalLock ? lockUnlockConditions.trim() : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể chốt bệnh án.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`Chốt bệnh án ${recordNumber} (DL-3.08)`}
      subtitle="Chuyển bệnh án sang trạng thái Đang điều trị. Phần khám và chẩn đoán sẽ bị khóa chỉnh sửa."
      width={520}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
          <Button tone="ghost" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button tone="primary" onClick={handleSubmit} disabled={busy}>
            Xác nhận chốt bệnh án
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

        {proposedStatus && (
          <Field label="Áp dụng trạng thái đề xuất" hint={`Cập nhật sức khỏe của ngựa thành: ${proposedStatus}`}>
            <Checkbox
              label="Áp dụng trạng thái này cho hồ sơ ngựa ngay khi chốt"
              checked={applyProposedStatus}
              onChange={setApplyProposedStatus}
            />
          </Field>
        )}

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <Checkbox
            label="Kích hoạt Khóa huấn luyện (Training Lock)"
            checked={proposeMedicalLock}
            onChange={setProposeMedicalLock}
          />
          <span style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginTop: 4 }}>
            Lệnh có ưu tiên cao nhất toàn hệ thống, tự động chặn bài tập nặng và treo đăng ký thi đấu.
          </span>
        </div>

        {proposeMedicalLock && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingLeft: 12, borderLeft: "2px solid var(--danger)" }}>
            <Field label="Lý do khóa huấn luyện *" hint="Mô tả tổn thương hoặc chỉ định thú y cần cách ly/nghỉ ngơi">
              <Textarea
                rows={2}
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                placeholder="VD: Viêm gân độ 2 cần nghỉ hoàn toàn..."
                required
              />
            </Field>

            <Field label="Số ngày dự kiến nghỉ ngơi" hint="Hệ thống sẽ tính ngày xem xét lại = hôm nay + số ngày này">
              <Input
                type="number"
                min={1}
                max={180}
                value={lockExpectedRestDays}
                onChange={(e) => setLockExpectedRestDays(Number(e.target.value))}
              />
            </Field>

            <Field label="Điều kiện mở khóa" hint="Tiêu chí để VET xem xét gỡ khóa">
              <Input
                value={lockUnlockConditions}
                onChange={(e) => setLockUnlockConditions(e.target.value)}
                placeholder="VD: Tái khám siêu âm gân lành hoàn toàn, không đau khi ấn..."
              />
            </Field>
          </div>
        )}
      </form>
    </Modal>
  );
}
