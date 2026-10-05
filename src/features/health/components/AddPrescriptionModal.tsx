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
  { value: "tablets", label: "tablets" },
  { value: "sachets", label: "sachets" },
];

const ROUTE_OPTIONS = [
  { value: "Oral", label: "Oral (PO)" },
  { value: "Intramuscular", label: "Intramuscular (IM)" },
  { value: "Intravenous", label: "Intravenous (IV)" },
  { value: "Subcutaneous", label: "Subcutaneous (SC)" },
  { value: "Topical", label: "Topical" },
  { value: "Ophthalmic", label: "Ophthalmic" },
];

interface AddPrescriptionModalProps {
  onClose: () => void;
  onSubmit: (input: PrescriptionInput) => Promise<void>;
}

export function AddPrescriptionModal({ onClose, onSubmit }: AddPrescriptionModalProps) {
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState(1);
  const [unit, setUnit] = useState("g");
  const [route, setRoute] = useState("Oral");
  const [frequencyPerDay, setFrequencyPerDay] = useState(2);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [daysCount, setDaysCount] = useState(5);
  const [withdrawalDays, setWithdrawalDays] = useState(7);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = dosage * frequencyPerDay * daysCount;

  // Calculate withdrawal clearance date
  const startD = new Date(startDate);
  const endD = new Date(startD.getTime() + (daysCount - 1) * 86400000);
  const withdrawalEndD = new Date(endD.getTime() + withdrawalDays * 86400000);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!medicationName.trim()) {
      setError("Please enter medication name.");
      return;
    }
    if (dosage <= 0 || frequencyPerDay <= 0 || daysCount <= 0) {
      setError("Dose, frequency, and treatment days must be greater than 0.");
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
      setError(err instanceof Error ? err.message : "Failed to record prescription.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Prescribe Medication"

      subtitle="Manage dosage, administration route, and automated pre-race withdrawal clearance calculation."
      width={540}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
          <Button tone="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button tone="primary" onClick={handleSubmit} disabled={busy}>
            Save Prescription
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

        <Field label="Medication Name *" hint="Select or enter active ingredient / commercial drug name">
          <Input
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
            placeholder="e.g., Phenylbutazone Paste, Dexamethasone, Flunixin Meglumine..."
            required
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.5fr", gap: 10 }}>
          <Field label="Dose per Intake *">
            <Input
              type="number"
              step="any"
              min={0.1}
              value={dosage}
              onChange={(e) => setDosage(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Unit *">
            <Select options={UNIT_OPTIONS} value={unit} onChange={(e) => setUnit(e.target.value)} />
          </Field>
          <Field label="Route *">
            <Select options={ROUTE_OPTIONS} value={route} onChange={(e) => setRoute(e.target.value)} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Field label="Frequency (times/day) *">
            <Input
              type="number"
              min={1}
              max={6}
              value={frequencyPerDay}
              onChange={(e) => setFrequencyPerDay(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Start Date *">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </Field>
          <Field label="Duration (days) *">
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
            Total medication required: <strong>{totalAmount} {unit}</strong>
          </span>
          <span>
            Through: <strong>{endD.toLocaleDateString("en-US")}</strong>
          </span>
        </div>

        <Field
          label="Pre-Race Withdrawal Period (days)"
          hint="Anti-doping clearance protocol; triggers alerts upon race registration if violated."
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
              Clearance date: <strong>{withdrawalEndD.toLocaleDateString("en-US")}</strong>
            </span>
          </div>
        </Field>

        <Field label="Administration Instructions" hint="Notes for Groom or stable care technicians">
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Mix into morning and evening grain rations after feeding..."
          />
        </Field>
      </form>
    </Modal>
  );
}
