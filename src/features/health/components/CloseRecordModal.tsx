import { useState } from "react";
import type { FormEvent } from "react";
import { Field } from "@/shared/components/form/Field";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";

const TREATMENT_RESULT_OPTIONS = [
  { value: "Khỏi hoàn toàn", label: "Khỏi hoàn toàn (Fully recovered)" },
  { value: "Thuyên giảm đáng kể", label: "Thuyên giảm đáng kể (Significantly improved)" },
  { value: "Không thuyên giảm", label: "Không thuyên giảm / Cần chuyển tuyến chuyên sâu" },
];

interface CloseRecordModalProps {
  recordNumber: string;
  isClosed?: boolean;
  onClose: () => void;
  onConfirmClose: (conclusion: string, result: string) => Promise<void>;
  onConfirmReopen: (reason: string) => Promise<void>;
}

export function CloseRecordModal({
  recordNumber,
  isClosed = false,
  onClose,
  onConfirmClose,
  onConfirmReopen,
}: CloseRecordModalProps) {
  const [conclusion, setConclusion] = useState("");
  const [treatmentResult, setTreatmentResult] = useState("Khỏi hoàn toàn");
  const [reopenReason, setReopenReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isClosed) {
        if (!reopenReason.trim()) {
          setError("Vui lòng nhập lý do mở lại bệnh án.");
          setBusy(false);
          return;
        }
        await onConfirmReopen(reopenReason.trim());
      } else {
        if (conclusion.trim().length < 10) {
          setError("Kết luận điều trị phải có ít nhất 10 ký tự.");
          setBusy(false);
          return;
        }
        await onConfirmClose(conclusion.trim(), treatmentResult);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={isClosed ? `Mở lại bệnh án ${recordNumber} (DL-3.09)` : `Kết thúc điều trị bệnh án ${recordNumber} (DL-3.09)`}
      subtitle={
        isClosed
          ? "Chỉ được mở lại trong vòng 7 ngày kể từ khi kết thúc để bổ sung điều trị."
          : "Kết thúc bệnh án. Mọi loại thuốc đang dùng sẽ tự động chuyển sang Đã dừng."
      }
      width={500}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
          <Button tone="ghost" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button tone="primary" onClick={handleSubmit} disabled={busy}>
            {isClosed ? "Xác nhận mở lại" : "Lưu kết luận & Đóng bệnh án"}
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

        {isClosed ? (
          <Field label="Lý do mở lại bệnh án *" hint="Nêu rõ diễn biến tái phát hoặc yêu cầu tái điều trị">
            <Textarea
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="VD: Ngựa tái phát triệu chứng sưng nhẹ sau 2 ngày dừng thuốc..."
              required
            />
          </Field>
        ) : (
          <>
            <Field label="Đánh giá kết quả điều trị *">
              <Select
                options={TREATMENT_RESULT_OPTIONS}
                value={treatmentResult}
                onChange={(e) => setTreatmentResult(e.target.value)}
              />
            </Field>

            <Field label="Kết luận điều trị *" hint="Tối thiểu 10 ký tự, tối đa 2000 ký tự">
              <Textarea
                rows={4}
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                placeholder="Đánh giá tổng thể hiệu quả phác đồ, tình trạng hiện tại và lời khuyên chăm sóc phục hồi tiếp theo..."
                required
              />
            </Field>
          </>
        )}
      </form>
    </Modal>
  );
}
