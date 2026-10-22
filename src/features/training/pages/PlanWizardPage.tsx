import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
import { Alert } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { useCurrentUser } from '@/shared/components/layout/authContext';
import { useToast } from '@/shared/components/ui/useToast';
import { messageFor } from "@/shared/lib/messages";
import { getHorses } from "@/features/horses/api";
import type { Horse } from "@/features/horses/types";
import { todayClub, trainingApi } from "../api";
import { PHASE_TYPE_LABEL } from "../types";
import type { PhaseSurface, PhaseType, TrainingPhase, TrainingPlan } from "../types";

import { tr } from "@/shared/i18n/tr";
const SURFACE_LABEL: Record<PhaseSurface, string> = { TURF: "Turf", DIRT: "Dirt", SYNTHETIC: "Mixed / synthetic" };
const MEDICAL = ["UNDER_OBSERVATION", "INJURED", "ISOLATED"];

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function newPhase(startDate: string, endDate: string, index: number): TrainingPhase {
  return {
    id: `ph-${Date.now()}-${index}`,
    name: `Phase ${index + 1}`,
    type: "BASE",
    startDate,
    endDate,
    sessionsPerWeek: 5,
    maxWeeklyDistance: 9000,
    surface: "TURF",
  };
}

/** Kiểm form trước khi gửi (BE kiểm lại tất cả). Trả câu lỗi đầu tiên hoặc "". */
function validate(name: string, objective: string, start: string, end: string, phases: TrainingPhase[]): string {
  if (name.trim().length < 3 || name.trim().length > 150) return "Plan name must be 3 to 150 characters.";
  if (objective.trim().length < 10 || objective.trim().length > 1000) return "Objective must be 10 to 1000 characters.";
  if (end < start) return "End date must be on or after the start date.";
  if (phases.length === 0) return "A plan needs at least one phase.";
  const sorted = [...phases].sort((a, b) => a.startDate.localeCompare(b.startDate));
  for (const [i, p] of sorted.entries()) {
    if (p.name.trim().length < 2) return "Each phase needs a name (2-100 characters).";
    if (p.endDate < p.startDate) return `Phase ${p.name}: end date must be on or after the start date.`;
    if (p.startDate < start || p.endDate > end) return `Phase ${p.name} must be within the plan dates.`;
    if (i > 0 && p.startDate <= sorted[i - 1].endDate) return `Phase ${p.name} overlaps phase ${sorted[i - 1].name}.`;
  }
  return "";
}

/** SC-2.03 Tạo / Sửa giáo án (HT). Sửa được khi Nháp hoặc Đang áp dụng. */
export default function PlanWizardPage() {
  const { id } = useParams<{ id?: string }>();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();

  const [horses, setHorses] = useState<Horse[]>([]);
  const [existing, setExisting] = useState<TrainingPlan | null>(null);
  const [horseId, setHorseId] = useState("");
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState(todayClub());
  const [endDate, setEndDate] = useState(addDays(todayClub(), 41));
  const [phases, setPhases] = useState<TrainingPhase[]>(() => [newPhase(todayClub(), addDays(todayClub(), 41), 0)]);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getHorses({ limit: 100 })
      .then((res) => {
        const usable = res.items.filter((h) => h.status !== "RETIRED");
        setHorses(usable);
        if (!editing) setHorseId((cur) => cur || usable[0]?.id || "");
      })
      .catch((err) => toast.show(messageFor(err), "danger"));
  }, [editing, toast]);

  useEffect(() => {
    if (!id) return;
    trainingApi
      .getPlanById(id)
      .then((p) => {
        setExisting(p);
        setHorseId(p.horseId);
        setName(p.name);
        setObjective(p.objective ?? "");
        setNotes(p.notes ?? "");
        setStartDate(p.startDate);
        setEndDate(p.endDate);
        setPhases(p.phases);
      })
      .catch((err) => setError(messageFor(err)));
  }, [id]);

  // DL-2.09 / Bug #68: đóng tab / tải lại khi có thay đổi chưa lưu -> trình duyệt hỏi lại.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Bug #68: Chuyển trang qua router / Sidebar khi chưa lưu -> hỏi xác nhận
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm("You have unsaved changes. Leaving will lose them.")) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  const horse = useMemo(() => horses.find((h) => h.id === horseId), [horses, horseId]);
  const change =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setDirty(true);
    };
  const updatePhase = (index: number, patch: Partial<TrainingPhase>) => {
    setPhases((cur) => cur.map((p, i) => (i === index ? { ...p, ...patch } : p)));
    setDirty(true);
  };
  const addPhase = () => {
    const last = [...phases].sort((a, b) => a.startDate.localeCompare(b.startDate)).at(-1);
    const from = last ? addDays(last.endDate, 1) : startDate;
    setPhases((cur) => [...cur, newPhase(from > endDate ? endDate : from, endDate, cur.length)]);
    setDirty(true);
  };
  const removePhase = (index: number) => {
    const ph = phases[index];
    // BTN-2.10: khi sửa, xóa giai đoạn sẽ xóa các buổi tập chưa diễn ra trong giai đoạn đó.
    if (editing && !window.confirm(`Removing phase ${ph.name} deletes its workouts that have not happened yet. Continue?`)) return;
    setPhases((cur) => cur.filter((_, i) => i !== index));
    setDirty(true);
  };

  const cancel = () => {
    if (dirty && !window.confirm("You have unsaved changes. Leaving will lose them.")) return;
    navigate(editing && id ? `/training/plans/${id}` : "/training/plans");
  };

  const save = async (activate: boolean) => {
    const problem = validate(name, objective, startDate, endDate, phases);
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = { horseId, phaseName: name.trim(), objective: objective.trim(), notes: notes.trim(), startDate, endDate, phases };
      const saved = editing && id ? await trainingApi.updatePlan(id, payload) : await trainingApi.createPlan(payload);
      setDirty(false);
      toast.show("Training plan saved.", "ok");
      navigate(`/training/plans/${saved.id}${activate ? "?activate=1" : ""}`);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (user.role !== "HEAD_TRAINER") {
    return <Alert tone="danger" title={tr("Not allowed")}>{tr("Only the Head Trainer can create or edit training plans.")}</Alert>;
  }
  const canActivateAfterSave = !editing || existing?.status === "DRAFT";

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div>
        <h1 style={{ fontSize: "var(--fs-kpi)", fontWeight: 700, margin: 0 }}>
          {editing ? tr(`Edit ${existing?.planCode ?? "plan"}`) : tr("Create Training Plan")}
        </h1>
        <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "var(--fs-body)" }}>
          {tr("A new plan is saved as a draft. Add workouts, then activate it.")}
        </p>
      </div>

      {error && <Alert tone="danger" title={tr("Cannot save")}>{error}</Alert>}

      <Card pad={24}>
        <h2 style={{ margin: "0 0 1rem", fontSize: "var(--fs-section)" }}>{tr("General information")}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          <Field label={tr("Horse")} required>
            <Select
              value={horseId}
              disabled={editing}
              onChange={(e) => change(setHorseId)(e.target.value)}
              options={horses.map((h) => ({ value: h.id, label: `${h.name} (${h.horseCode ?? ""})${h.isMedicalLocked ? " · Training Lock" : ""}` }))}
            />
          </Field>
          <Field label={tr("Plan name")} required hint={tr("3-150 characters")}>
            <Input value={name} maxLength={150} onChange={(e) => change(setName)(e.target.value)} />
          </Field>
          <Field label={tr("Start date")} required hint={editing ? undefined : tr("No earlier than 7 days ago")}>
            <Input type="date" value={startDate} onChange={(e) => change(setStartDate)(e.target.value)} />
          </Field>
          <Field label={tr("End date")} required hint={tr("At most 52 weeks")}>
            <Input type="date" min={startDate} value={endDate} onChange={(e) => change(setEndDate)(e.target.value)} />
          </Field>
        </div>
        {horse?.isMedicalLocked && (
          <div style={{ marginTop: "1rem" }}>
            <Alert tone="danger" title={tr("Training Lock")}>
              {tr("The horse is under a Training Lock. You can prepare a draft, but it cannot be activated yet.")}
            </Alert>
          </div>
        )}
        {horse && !horse.isMedicalLocked && MEDICAL.includes(horse.status) && (
          <div style={{ marginTop: "1rem" }}>
            <Alert tone="warn" title={tr("Medical status")}>{tr("The horse is in status {{status}}.", { status: horse.status })}</Alert>
          </div>
        )}
        <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
          <Field label={tr("Objective")} required hint={tr("10-1000 characters")}>
            <Textarea rows={2} maxLength={1000} value={objective} onChange={(e) => change(setObjective)(e.target.value)} />
          </Field>
          <Field label={tr("Notes")} hint={tr("Up to 1000 characters")}>
            <Textarea rows={2} maxLength={1000} value={notes} onChange={(e) => change(setNotes)(e.target.value)} />
          </Field>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: "var(--fs-section)" }}>{tr("Phases ({{count}}/12)", { count: phases.length })}</h2>
        <Button tone="secondary" onClick={addPhase} disabled={phases.length >= 12}>{tr("+ Add phase")}</Button>
      </div>

      {phases.map((ph, i) => (
        <Card key={ph.id} pad={20}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <strong>{tr("Phase #{{number}}", { number: i + 1 })}</strong>
            {phases.length > 1 && (
              <Button tone="ghost" size="sm" onClick={() => removePhase(i)}>{tr("Remove phase")}</Button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <Field label={tr("Phase name")} required>
              <Input value={ph.name} maxLength={100} onChange={(e) => updatePhase(i, { name: e.target.value })} />
            </Field>
            <Field label={tr("Phase type")} required>
              <Select
                value={ph.type}
                onChange={(e) => updatePhase(i, { type: e.target.value as PhaseType })}
                options={(Object.keys(PHASE_TYPE_LABEL) as PhaseType[]).map((t) => ({ value: t, label: tr(PHASE_TYPE_LABEL[t]) }))}
              />
            </Field>
            <Field label={tr("From")} required>
              <Input type="date" min={startDate} max={endDate} value={ph.startDate} onChange={(e) => updatePhase(i, { startDate: e.target.value })} />
            </Field>
            <Field label={tr("To")} required>
              <Input type="date" min={ph.startDate} max={endDate} value={ph.endDate} onChange={(e) => updatePhase(i, { endDate: e.target.value })} />
            </Field>
            <Field label={tr("Sessions per week")} required hint={tr("1 – 14")}>
              <Input type="number" min={1} max={14} value={ph.sessionsPerWeek} onChange={(e) => updatePhase(i, { sessionsPerWeek: Number(e.target.value) })} />
            </Field>
            <Field label={tr("Max distance per week (m)")} required hint={tr("500 – 60 000")}>
              <Input
                type="number"
                min={500}
                max={60000}
                step={100}
                value={ph.maxWeeklyDistance}
                onChange={(e) => updatePhase(i, { maxWeeklyDistance: Number(e.target.value) })}
              />
            </Field>
            <Field label={tr("Main surface")} required>
              <Select
                value={ph.surface}
                onChange={(e) => updatePhase(i, { surface: e.target.value as PhaseSurface })}
                options={(Object.keys(SURFACE_LABEL) as PhaseSurface[]).map((s) => ({ value: s, label: tr(SURFACE_LABEL[s]) }))}
              />
            </Field>
            <Field label={tr("Target speed (km/h)")} hint={tr("10 – 70, optional")}>
              <Input
                type="number"
                min={10}
                max={70}
                step={0.1}
                value={ph.targetSpeedKmh ?? ""}
                onChange={(e) => updatePhase(i, { targetSpeedKmh: e.target.value === "" ? undefined : Number(e.target.value) })}
              />
            </Field>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <Field label={tr("Phase goal")} hint={tr("Up to 500 characters")}>
              <Textarea rows={2} maxLength={500} value={ph.goal ?? ""} onChange={(e) => updatePhase(i, { goal: e.target.value })} />
            </Field>
          </div>
        </Card>
      ))}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", padding: "0.75rem 0" }}>
        <Button tone="ghost" onClick={cancel}>{tr("Cancel")}</Button>
        <Button tone="secondary" onClick={() => void save(false)} disabled={submitting || !horseId}>
          {editing && existing?.status === "ACTIVE" ? tr("Save") : tr("Save draft")}
        </Button>
        {canActivateAfterSave && (
          <Button tone="primary" onClick={() => void save(true)} disabled={submitting || !horseId}>
            {tr("Save and activate")}
          </Button>
        )}
      </div>
    </div>
  );
}
