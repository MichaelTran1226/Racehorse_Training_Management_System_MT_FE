import { useEffect, useState } from "react";
import { Alert } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { useToast } from "@/shared/components/ui/Toast";
import { ApiError } from "@/shared/lib/api";
import { messageFor } from "@/shared/lib/messages";
import { getHorses } from "@/features/horses/api";
import type { Horse } from "@/features/horses/types";
import { todayClub, trainingApi } from "../api";
import type { TrainingPlan } from "../types";

interface DialogProps {
  plan: TrainingPlan;
  onClose: () => void;
  onDone: (plan?: TrainingPlan) => void;
}

/**
 * DL-2.02 Kích hoạt: danh sách kiểm tra hiện trước; BE kiểm lại tất cả.
 * Ngựa ở trạng thái y tế -> phải tích "đã trao đổi với Bác sĩ thú y".
 */
export function ActivatePlanDialog({ plan, onClose, onDone }: DialogProps) {
  const toast = useToast();
  const medical = ["UNDER_OBSERVATION", "INJURED", "ISOLATED"].includes(plan.horseStatus ?? "");
  const [moveHorse, setMoveHorse] = useState(plan.horseStatus === "RESTING");
  const [vetConsulted, setVetConsulted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const checks: { ok: boolean; text: string }[] = [
    { ok: !plan.isLockedByMedical, text: plan.isLockedByMedical ? "The horse is under a Training Lock." : "No Training Lock" },
    { ok: plan.horseStatus !== "RETIRED", text: "Horse still managed" },
    { ok: plan.workoutCount > 0, text: plan.workoutCount > 0 ? `${plan.workoutCount} workout(s) scheduled` : "The plan has no workouts yet." },
    { ok: plan.endDate >= todayClub(), text: "End date not passed" },
  ];
  const blocked = checks.some((c) => !c.ok);

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const updated = await trainingApi.activatePlan(plan.id, { moveHorseToTraining: moveHorse, vetConsulted });
      toast.show("Training plan activated.", "ok");
      onDone(updated);
      onClose();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Activate ${plan.name}`}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button tone="ghost" onClick={onClose}>Cancel</Button>
          <Button tone="primary" onClick={() => void submit()} disabled={submitting || blocked || (medical && !vetConsulted)}>
            Activate
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {error && <Alert tone="danger" title="Cannot activate yet">{error}</Alert>}
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {checks.map((c) => (
            <li key={c.text} style={{ color: c.ok ? "var(--ok)" : "var(--danger)" }}>
              {c.ok ? "✔" : "✖"} {c.text}
            </li>
          ))}
          <li style={{ color: "var(--text-muted)" }}>• No other active plan for {plan.horseName} (checked when you confirm)</li>
          {medical && <li style={{ color: "var(--warn)" }}>⚠ The horse is in status {plan.horseStatus}.</li>}
        </ul>
        {plan.horseStatus === "RESTING" && (
          <Checkbox label="Also move the horse from Resting to In Training" checked={moveHorse} onChange={setMoveHorse} />
        )}
        {medical && (
          <Checkbox label="I have discussed this plan with the Veterinarian" checked={vetConsulted} onChange={setVetConsulted} />
        )}
      </div>
    </Modal>
  );
}

/** DL-2.04 Hoàn thành (nhận xét 10-2000) và DL-2.03 Hủy (lý do 10-500). */
export function ClosePlanDialog({ kind, plan, onClose, onDone }: DialogProps & { kind: "complete" | "cancel" }) {
  const toast = useToast();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const max = kind === "complete" ? 2000 : 500;
  const len = text.trim().length;

  const submit = async () => {
    setSubmitting(true);
    try {
      const updated =
        kind === "complete" ? await trainingApi.completePlan(plan.id, text.trim()) : await trainingApi.cancelPlan(plan.id, text.trim());
      toast.show(kind === "complete" ? "Training plan completed." : "Training plan cancelled.", "ok");
      onDone(updated);
      onClose();
    } catch (err) {
      toast.show(messageFor(err), "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`${kind === "complete" ? "Complete" : "Cancel"} ${plan.name}`}
      tone={kind === "cancel" ? "danger" : undefined}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button tone="ghost" onClick={onClose}>Close</Button>
          <Button tone={kind === "cancel" ? "danger" : "primary"} onClick={() => void submit()} disabled={submitting || len < 10 || len > max}>
            {kind === "complete" ? "Complete plan" : "Cancel plan"}
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {kind === "complete" && (
          <p style={{ margin: 0, fontSize: "0.875rem" }}>
            {plan.progress.completed}/{plan.progress.due} due workouts completed.
          </p>
        )}
        <p style={{ margin: 0, fontSize: "0.875rem" }}>
          Workouts that have not happened yet will be cancelled. Results of completed workouts are kept.
        </p>
        <Field label={kind === "complete" ? "Summary" : "Reason for cancelling"} required hint={`10-${max} characters`}>
          <Textarea rows={3} maxLength={max} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/** DL-2.08 Nhân bản giáo án sang ngựa khác (bản mới là Nháp). */
export function ClonePlanDialog({ plan, onClose, onDone }: DialogProps) {
  const toast = useToast();
  const [horses, setHorses] = useState<Horse[]>([]);
  const [horseId, setHorseId] = useState("");
  const [name, setName] = useState(`${plan.name} (copy)`);
  const [startDate, setStartDate] = useState(todayClub());
  const [copyWorkouts, setCopyWorkouts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getHorses({ limit: 100 })
      .then((res) => {
        const usable = res.items.filter((h) => h.status !== "RETIRED");
        setHorses(usable);
        setHorseId(usable[0]?.id ?? "");
      })
      .catch((err) => toast.show(messageFor(err), "danger"));
  }, [toast]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const created = await trainingApi.clonePlan(plan.id, { targetHorseId: horseId, name: name.trim(), startDate, copyWorkouts });
      toast.show("Training plan copied as a new draft.", "ok");
      onDone(created);
      onClose();
    } catch (err) {
      toast.show(messageFor(err), "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Clone ${plan.name}`}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button tone="ghost" onClick={onClose}>Cancel</Button>
          <Button tone="primary" onClick={() => void submit()} disabled={submitting || !horseId || name.trim().length < 3 || name.trim().length > 150}>
            Clone
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Field label="Horse" required>
          <Select
            value={horseId}
            onChange={(e) => setHorseId(e.target.value)}
            options={horses.map((h) => ({ value: h.id, label: `${h.name} (${h.horseCode ?? ""})${h.isMedicalLocked ? " – Training Lock 🔒" : ""}` }))}
          />
        </Field>
        <Field label="New plan name" required hint="3-150 characters">
          <Input value={name} maxLength={150} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="New start date" required>
          <Input type="date" min={todayClub()} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Checkbox label="Copy workouts (dates shift with the new start date, results are not copied)" checked={copyWorkouts} onChange={setCopyWorkouts} />
      </div>
    </Modal>
  );
}

/** Lỗi API có mã nào không (dùng cho các hộp thoại cần bấm lần 2). */
export function hasCode(err: unknown, code: string): err is ApiError {
  return err instanceof ApiError && err.code === code;
}
