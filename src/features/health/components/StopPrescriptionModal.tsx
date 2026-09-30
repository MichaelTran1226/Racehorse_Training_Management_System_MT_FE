import { useState } from "react";
import type { FormEvent } from "react";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import type { StopPrescriptionInput } from "../types";

const STOP_REASON_OPTIONS = [
  { value: "Đã khỏi", label: "Đã khỏi bệnh / Hết triệu chứng" },
  { value: "Tác dụng phụ", label: "Phát hiện tác dụng phụ / Dị ứng" },
  { value: "Đổi thuốc", label: "Đổi sang phác đồ thuốc khác hiệu quả hơn" },
  { value: "Khác", label: "Lý do khác" },
];

interface StopPrescriptionModalProps {
  medicationName: string;
  onClose: () => void;
  onSubmit: (input: StopPrescriptionInput) => Promise<void>;
}

export function StopPrescriptionModal({ medicationName, onClose, onSubmit }: StopPrescriptionModalProps) {
  const [stoppedReason, setStoppedReason] = useState("Đã khỏi");
  const [stopNotes, setStopNotes] = useState("");
  const [stoppedDate, setStoppedDate] = useState(new Date().toISOString().split("T")[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        stoppedReason,
        stopNotes: stopNotes.trim() || undefined,
        stoppedDate,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi dừng thuốc.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`Dừng thuốc: ${medicationName} (DL-3.06)`}
      subtitle="Chuyển trạng thái thuốc sang Đã dừng. Thuốc đã dừng không thể phục hồi sử dụng."
      width={480}
      tone="warn"
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
          <Button tone="ghost" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button tone="danger" onClick={handleSubmit} disabled={busy}>
            Xác nhận dừng thuốc
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

        <Field label="Lý do dừng thuốc *">
          <Select
            options={STOP_REASON_OPTIONS}
            value={stoppedReason}
            onChange={(e) => setStoppedReason(e.target.value)}
          />
        </Field>

        <Field label="Ngày dừng *">
          <Input type="date" value={stoppedDate} onChange={(e) => setStoppedDate(e.target.value)} required />
        </Field>

        <Field label="Ghi chú chi tiết">
          <Textarea
            rows={2}
            value={stopNotes}
            onChange={(e) => setStopNotes(e.target.value)}
            placeholder="Mô tả lý do hoặc đánh giá lâm sàng khi quyết định dừng..."
          />
        </Field>
      </form>
    </Modal>
  );
}
