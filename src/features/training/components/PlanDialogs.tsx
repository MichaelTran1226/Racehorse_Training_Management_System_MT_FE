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
import { useAppLanguage } from "@/shared/lib/language";
import { ApiError } from "@/shared/lib/api";
import { messageFor } from "@/shared/lib/messages";
import { getHorses } from "@/features/horses/api";
import type { Horse } from "@/features/horses/types";
import { todayClub, trainingApi } from "../api";
import type { TrainingPlan } from "../types";
import { Icon } from "@/shared/components/ui/Icon";

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
  const { isVietnamese } = useAppLanguage();
  const medical = ["UNDER_OBSERVATION", "INJURED", "ISOLATED"].includes(plan.horseStatus ?? "");
  const [moveHorse, setMoveHorse] = useState(plan.horseStatus === "RESTING");
  const [vetConsulted, setVetConsulted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const checks: { ok: boolean; text: string }[] = [
    {
      ok: !plan.isLockedByMedical,
      text: plan.isLockedByMedical
        ? (isVietnamese ? "Chiến mã đang bị Khóa huấn luyện." : "The horse is under a Training Lock.")
        : (isVietnamese ? "Không bị Khóa huấn luyện" : "No Training Lock"),
    },
    { ok: plan.horseStatus !== "RETIRED", text: isVietnamese ? "Chiến mã còn trong quản lý" : "Horse still managed" },
    {
      ok: plan.workoutCount > 0,
      text: plan.workoutCount > 0
        ? (isVietnamese ? `Đã lên lịch ${plan.workoutCount} bài tập` : `${plan.workoutCount} workout(s) scheduled`)
        : (isVietnamese ? "Giáo án chưa có bài tập nào." : "The plan has no workouts yet."),
    },
    { ok: plan.endDate >= todayClub(), text: isVietnamese ? "Chưa quá ngày kết thúc" : "End date not passed" },
  ];
  const blocked = checks.some((c) => !c.ok);

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const updated = await trainingApi.activatePlan(plan.id, { moveHorseToTraining: moveHorse, vetConsulted });
      toast.show(isVietnamese ? "Đã kích hoạt kế hoạch huấn luyện." : "Training plan activated.", "ok");
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
      title={isVietnamese ? `Kích hoạt ${plan.name}` : `Activate ${plan.name}`}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button tone="ghost" onClick={onClose}>{isVietnamese ? "Hủy" : "Cancel"}</Button>
          <Button tone="primary" onClick={() => void submit()} disabled={submitting || blocked || (medical && !vetConsulted)}>
            {isVietnamese ? "Kích hoạt" : "Activate"}
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {error && <Alert tone="danger" title={isVietnamese ? "Chưa thể kích hoạt" : "Cannot activate yet"}>{error}</Alert>}
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {checks.map((c) => (
            <li key={c.text} style={{ color: c.ok ? "var(--ok)" : "var(--danger)" }}>
              <Icon name={c.ok ? "check" : "x"} size={14} style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 6 }} />
                {c.ok ? "" : <span className="sr-only">Not met: </span>}
                {c.text}
            </li>
          ))}
          <li style={{ color: "var(--text-muted)" }}>
            • {isVietnamese ? `Không có giáo án nào khác đang chạy cho ${plan.horseName} (kiểm tra khi xác nhận)` : `No other active plan for ${plan.horseName} (checked when you confirm)`}
          </li>
          {medical && (
            <li style={{ color: "var(--warn)" }}>
              <Icon name="alert" size={14} style={{ display: "inline-block", verticalAlign: "-2px", marginRight: 6 }} />
              {isVietnamese ? `Chiến mã đang ở trạng thái ${plan.horseStatus}.` : `The horse is in status ${plan.horseStatus}.`}
            </li>
          )}
        </ul>
        {plan.workoutCount === 0 && (
          <div style={{ marginTop: "0.5rem", padding: "0.6rem 0.8rem", borderRadius: "8px", background: "var(--surface-sunken)", border: "1px solid var(--border)", fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
            {isVietnamese ? (
              <>
                💡 <strong>Hướng dẫn:</strong> Giáo án cần có ít nhất 1 bài tập trước khi kích hoạt. Hãy đóng hộp thoại này, mở tab <strong>Workouts</strong> của giáo án và bấm <strong>+ Add workout</strong> để thêm bài tập (hoặc thêm một lượt chạy thử Trial run).
              </>
            ) : (
              <>
                💡 <strong>Tip:</strong> A training plan must have at least 1 workout before activation. Please close this dialog, switch to the <strong>Workouts</strong> tab and click <strong>+ Add workout</strong> to schedule a workout or trial run.
              </>
            )}
          </div>
        )}
        {plan.horseStatus === "RESTING" && (
          <Checkbox
            label={isVietnamese ? "Đồng thời chuyển ngựa từ Nghỉ ngơi sang Huấn luyện" : "Also move the horse from Resting to In Training"}
            checked={moveHorse}
            onChange={setMoveHorse}
          />
        )}
        {medical && (
          <Checkbox
            label={isVietnamese ? "Tôi đã trao đổi kế hoạch này với Bác sĩ thú y" : "I have discussed this plan with the Veterinarian"}
            checked={vetConsulted}
            onChange={setVetConsulted}
          />
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
          <p style={{ margin: 0, fontSize: "var(--fs-body)" }}>
            {plan.progress.completed}/{plan.progress.due} due workouts completed.
          </p>
        )}
        <p style={{ margin: 0, fontSize: "var(--fs-body)" }}>
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
            options={horses.map((h) => ({ value: h.id, label: `${h.name} (${h.horseCode ?? ""})${h.isMedicalLocked ? " · Training Lock" : ""}` }))}
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
