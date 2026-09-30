import { useState } from "react";
import type { FormEvent } from "react";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { Button } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/ui/Icon";
import { Modal } from "@/shared/components/ui/Modal";
import type { CareInstructionItem, TreatmentPhaseInput } from "../types";

const ACTIVITY_OPTIONS = [
  { value: "Nghỉ hoàn toàn", label: "Nghỉ hoàn toàn (Strict stall rest)" },
  { value: "Đi bộ nhẹ", label: "Đi bộ nhẹ (Hand walk 10-15 mins)" },
  { value: "Tập nhẹ", label: "Tập nhẹ (Light trotting / lunging)" },
  { value: "Tập bình thường", label: "Tập bình thường (Full training)" },
];

interface AddTreatmentPhaseModalProps {
  onClose: () => void;
  onSubmit: (input: TreatmentPhaseInput) => Promise<void>;
}

export function AddTreatmentPhaseModal({ onClose, onSubmit }: AddTreatmentPhaseModalProps) {
  const [phaseName, setPhaseName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  );
  const [target, setTarget] = useState("");
  const [allowedActivity, setAllowedActivity] = useState("Nghỉ hoàn toàn");
  const [instructions, setInstructions] = useState<CareInstructionItem[]>([
    { activity: "Ngâm chân nước đá", frequency: "2 lần/ngày" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addInstruction() {
    setInstructions([...instructions, { activity: "", frequency: "1 lần/ngày" }]);
  }

  function removeInstruction(index: number) {
    setInstructions(instructions.filter((_, i) => i !== index));
  }

  function updateInstruction(index: number, key: keyof CareInstructionItem, value: string) {
    const next = [...instructions];
    next[index] = { ...next[index], [key]: value };
    setInstructions(next);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!phaseName.trim()) {
      setError("Vui lòng nhập tên giai đoạn điều trị.");
      return;
    }
    if (!target.trim()) {
      setError("Vui lòng nhập mục tiêu điều trị.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        phaseName: phaseName.trim(),
        startDate,
        endDate,
        target: target.trim(),
        allowedActivity,
        careInstructions: instructions.filter((i) => i.activity.trim() !== ""),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi lưu giai đoạn điều trị.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Thêm giai đoạn điều trị (DL-3.04)"
      subtitle="Thiết lập mục tiêu, mức vận động cho phép và hướng dẫn chăm sóc cho Groom."
      width={560}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
          <Button tone="ghost" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button tone="primary" onClick={handleSubmit} disabled={busy}>
            Lưu giai đoạn
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

        <Field label="Tên giai đoạn *" hint="VD: Giai đoạn 1: Giảm viêm cấp tính">
          <Input
            value={phaseName}
            onChange={(e) => setPhaseName(e.target.value)}
            placeholder="Giai đoạn 1: Giảm sưng và kháng viêm..."
            required
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Từ ngày *">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </Field>
          <Field label="Đến ngày *">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </Field>
        </div>

        <Field label="Mức vận động cho phép *">
          <Select
            options={ACTIVITY_OPTIONS}
            value={allowedActivity}
            onChange={(e) => setAllowedActivity(e.target.value)}
          />
        </Field>

        <Field label="Mục tiêu giai đoạn *" hint="Tiêu chí để chuyển giai đoạn kế tiếp">
          <Textarea
            rows={2}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Hạ nhiệt khớp gối, đi lại không còn khập khiễng..."
            required
          />
        </Field>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Hướng dẫn chăm sóc hàng ngày (cho Groom)</span>
            <Button size="sm" tone="ghost" icon="plus" onClick={addInstruction}>
              Thêm việc
            </Button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {instructions.map((item, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr auto", gap: 8, alignItems: "center" }}>
                <Input
                  value={item.activity}
                  onChange={(e) => updateInstruction(idx, "activity", e.target.value)}
                  placeholder="Hoạt động chăm sóc (VD: Băng lạnh)"
                />
                <Input
                  value={item.frequency}
                  onChange={(e) => updateInstruction(idx, "frequency", e.target.value)}
                  placeholder="Tần suất (VD: 2 lần/ngày)"
                />
                {instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInstruction(idx)}
                    style={{ border: "none", background: "transparent", color: "var(--danger)", cursor: "pointer", padding: "4px" }}
                    title="Xóa dòng"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
