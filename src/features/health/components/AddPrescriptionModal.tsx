import { useState } from "react";
import type { FormEvent } from "react";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import type { PrescriptionInput } from "../types";

const UNIT_OPTIONS = [
  { value: "g", label: "g" },
  { value: "mg", label: "mg" },
  { value: "ml", label: "ml" },
  { value: "viên", label: "viên" },
  { value: "gói", label: "gói" },
];

const ROUTE_OPTIONS = [
  { value: "Uống", label: "Uống (Oral)" },
  { value: "Tiêm bắp", label: "Tiêm bắp (IM)" },
  { value: "Tiêm tĩnh mạch", label: "Tiêm tĩnh mạch (IV)" },
  { value: "Tiêm dưới da", label: "Tiêm dưới da (SC)" },
  { value: "Bôi ngoài da", label: "Bôi ngoài da (Topical)" },
  { value: "Nhỏ mắt", label: "Nhỏ mắt (Ophthalmic)" },
];

interface AddPrescriptionModalProps {
  onClose: () => void;
  onSubmit: (input: PrescriptionInput) => Promise<void>;
}

export function AddPrescriptionModal({ onClose, onSubmit }: AddPrescriptionModalProps) {
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState(1);
  const [unit, setUnit] = useState("g");
  const [route, setRoute] = useState("Uống");
  const [frequencyPerDay, setFrequencyPerDay] = useState(2);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [daysCount, setDaysCount] = useState(5);
  const [withdrawalDays, setWithdrawalDays] = useState(7);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = dosage * frequencyPerDay * daysCount;

  // Tính ngày hết hạn rút thuốc
  const startD = new Date(startDate);
  const endD = new Date(startD.getTime() + (daysCount - 1) * 86400000);
  const withdrawalEndD = new Date(endD.getTime() + withdrawalDays * 86400000);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!medicationName.trim()) {
      setError("Vui lòng nhập tên thuốc.");
      return;
    }
    if (dosage <= 0 || frequencyPerDay <= 0 || daysCount <= 0) {
      setError("Liều, tần suất và số ngày dùng phải lớn hơn 0.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        medicationName: medicationName.trim(),
        dosage: Number(dosage),
        unit,
        route,
        frequencyPerDay: Number(frequencyPerDay),
        startDate,
        daysCount: Number(daysCount),
        withdrawalDays: Number(withdrawalDays),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi kê đơn thuốc.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Kê đơn thuốc chi tiết (DL-3.05)"
      subtitle="Quản lý liều lượng, đường dùng và tính toán tự động thời gian ngưng thuốc trước thi đấu."
      width={540}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
          <Button tone="ghost" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button tone="primary" onClick={handleSubmit} disabled={busy}>
            Kê đơn thuốc
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

        <Field label="Tên thuốc *" hint="Chọn hoặc nhập tên biệt dược/hoạt chất">
          <Input
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
            placeholder="VD: Phenylbutazone, Dexamethasone, Banamine..."
            required
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.5fr", gap: 10 }}>
          <Field label="Liều mỗi lần *">
            <Input
              type="number"
              step="any"
              min={0.1}
              value={dosage}
              onChange={(e) => setDosage(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Đơn vị *">
            <Select options={UNIT_OPTIONS} value={unit} onChange={(e) => setUnit(e.target.value)} />
          </Field>
          <Field label="Đường dùng *">
            <Select options={ROUTE_OPTIONS} value={route} onChange={(e) => setRoute(e.target.value)} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Field label="Tần suất (lần/ngày) *">
            <Input
              type="number"
              min={1}
              max={6}
              value={frequencyPerDay}
              onChange={(e) => setFrequencyPerDay(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Từ ngày *">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </Field>
          <Field label="Số ngày dùng *">
            <Input
              type="number"
              min={1}
              max={90}
              value={daysCount}
              onChange={(e) => setDaysCount(Number(e.target.value))}
              required
            />
          </Field>
        </div>

        <div
          style={{
            background: "var(--surface-2)",
            padding: "10px 14px",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            fontSize: "13px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            Tổng lượng thuốc đợt này: <strong>{totalAmount} {unit}</strong>
          </span>
          <span>
            Đến ngày: <strong>{endD.toLocaleDateString("vi-VN")}</strong>
          </span>
        </div>

        <Field
          label="Thời gian ngưng thuốc trước thi đấu (ngày)"
          hint="Quy định chống Doping thi đấu; dùng để cảnh báo khi ngựa đăng ký giải đua."
        >
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, alignItems: "center" }}>
            <Input
              type="number"
              min={0}
              max={90}
              value={withdrawalDays}
              onChange={(e) => setWithdrawalDays(Number(e.target.value))}
            />
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              Hết thời hạn ngưng thuốc vào: <strong>{withdrawalEndD.toLocaleDateString("vi-VN")}</strong>
            </span>
          </div>
        </Field>

        <Field label="Chỉ dẫn sử dụng" hint="Ghi chú cho Groom hoặc nhân viên y tế">
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VD: Trộn vào khẩu phần cám sáng và tối sau ăn..."
          />
        </Field>
      </form>
    </Modal>
  );
}
