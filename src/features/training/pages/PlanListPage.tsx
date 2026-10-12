import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "@/shared/components/ui/Alert";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { Select } from "@/shared/components/form/Select";
import { Tabs } from "@/shared/components/ui/Tabs";
import { Textarea } from "@/shared/components/form/Textarea";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { ApiError } from "@/shared/lib/api";
import { messageFor } from "@/shared/lib/messages";
import { getHorses } from "@/features/horses/api";
import type { Horse } from "@/features/horses/types";
import { todayClub, trainingApi } from "../api";
import { PLAN_STATUS_LABEL } from "../types";
import type { PlanStatus, TrainingPlan } from "../types";

const STATUS_TONE: Record<PlanStatus, "ok" | "warn" | "danger" | "neutral" | "info"> = {
  DRAFT: "neutral",
  ACTIVE: "info",
  COMPLETED: "ok",
  CANCELLED: "danger",
};

type Dialog =
  | { kind: "activate"; plan: TrainingPlan }
  | { kind: "complete"; plan: TrainingPlan }
  | { kind: "cancel"; plan: TrainingPlan }
  | { kind: "clone"; plan: TrainingPlan }
  | null;

/** SC-2.02 Danh sách giáo án. Chỉ HT thao tác (Flow 2 §2); CM, VET, OWNER chỉ xem. */
export default function PlanListPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const toast = useToast();
  const isTrainer = user.role === "HEAD_TRAINER";

  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await trainingApi.getPlans());
    } catch (err) {
      toast.show(messageFor(err), "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (!isTrainer) return;
    getHorses({ limit: 100 })
      .then((res) => setHorses(res.items.filter((h) => h.status !== "RETIRED")))
      .catch((err) => toast.show(messageFor(err), "danger"));
  }, [isTrainer, toast]);

  const handleDelete = async (plan: TrainingPlan) => {
    try {
      await trainingApi.deletePlan(plan.id);
      toast.show(`Draft plan ${plan.name} deleted.`, "ok");
      void loadPlans();
    } catch (err) {
      toast.show(messageFor(err), "danger");
    }
  };

  const q = search.toLowerCase();
  const filteredPlans = plans.filter(
    (p) =>
      (activeTab === "ALL" || p.status === activeTab) &&
      (p.name.toLowerCase().includes(q) || p.planCode.toLowerCase().includes(q) || p.horseName.toLowerCase().includes(q)),
  );
  const count = (s: PlanStatus) => plans.filter((p) => p.status === s).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Training Plans</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Draft → Active → Completed / Cancelled. A plan needs at least one workout before it can be activated.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/training/plans/history">
            <Button tone="secondary">History</Button>
          </Link>
          {isTrainer && (
            <Button tone="primary" onClick={() => navigate("/training/plans/new")}>
              + Create New Plan
            </Button>
          )}
        </div>
      </div>

      <Card pad={16}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <Tabs
            items={[
              { id: "ALL", label: `All (${plans.length})` },
              { id: "ACTIVE", label: `Active (${count("ACTIVE")})` },
              { id: "DRAFT", label: `Draft (${count("DRAFT")})` },
              { id: "COMPLETED", label: `Completed (${count("COMPLETED")})` },
              { id: "CANCELLED", label: `Cancelled (${count("CANCELLED")})` },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
          <Input
            placeholder="Search by plan name, code, or horse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300, maxWidth: "100%" }}
          />
        </div>
      </Card>

      {plans.some((p) => p.isLockedByMedical && (p.status === "DRAFT" || p.status === "ACTIVE")) && (
        <Alert tone="danger" title="Training Lock in effect for some horses">
          Plans of locked horses cannot be activated and heavy workouts are blocked. Light and medium workouts can still be
          scheduled. <Link to="/medical/locks">View active locks →</Link>
        </Alert>
      )}

      <Card>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading training plans...</div>
        ) : filteredPlans.length === 0 ? (
          <EmptyState title="No Training Plans Found" description="There are no training plans matching the filter." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Plan</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Racehorse</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Schedule</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Workouts</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                  {isTrainer && <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: 600 }}>{plan.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {plan.planCode} · {plan.phases.length} phase(s)
                        {plan.targetDistanceMeters ? ` · target ${plan.targetDistanceMeters}m` : ""}
                      </div>
                      {plan.cancelledReason && (
                        <div style={{ fontSize: "0.75rem", color: "var(--danger)" }}>Cancelled: {plan.cancelledReason}</div>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Link to={`/horses/${plan.horseId}`} style={{ color: "var(--accent)", textDecoration: "underline" }}>
                        {plan.horseName}
                      </Link>
                      {plan.isLockedByMedical && (
                        <div style={{ fontSize: "0.75rem", color: "var(--danger)", fontWeight: 600 }}>🔒 Training Lock</div>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div>{plan.startDate}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>to {plan.endDate}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>{plan.workoutCount}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Badge tone={STATUS_TONE[plan.status]}>{PLAN_STATUS_LABEL[plan.status]}</Badge>
                    </td>
                    {isTrainer && (
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                          {plan.status === "DRAFT" && (
                            <Button
                              tone="primary"
                              size="sm"
                              onClick={() => setDialog({ kind: "activate", plan })}
                              disabled={plan.isLockedByMedical}
                              title={plan.isLockedByMedical ? "The horse is under a Training Lock." : ""}
                            >
                              Activate
                            </Button>
                          )}
                          {plan.status === "ACTIVE" && (
                            <Button tone="accent" size="sm" onClick={() => setDialog({ kind: "complete", plan })}>
                              Complete
                            </Button>
                          )}
                          {(plan.status === "DRAFT" || plan.status === "ACTIVE") && (
                            <Button tone="danger" size="sm" onClick={() => setDialog({ kind: "cancel", plan })}>
                              Cancel
                            </Button>
                          )}
                          <Button tone="secondary" size="sm" onClick={() => setDialog({ kind: "clone", plan })}>
                            Clone
                          </Button>
                          {plan.status === "DRAFT" && (
                            <Button tone="ghost" size="sm" onClick={() => void handleDelete(plan)}>
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {dialog?.kind === "activate" && (
        <ActivateDialog plan={dialog.plan} onClose={() => setDialog(null)} onDone={() => void loadPlans()} />
      )}
      {(dialog?.kind === "complete" || dialog?.kind === "cancel") && (
        <CloseDialog kind={dialog.kind} plan={dialog.plan} onClose={() => setDialog(null)} onDone={() => void loadPlans()} />
      )}
      {dialog?.kind === "clone" && (
        <CloneDialog plan={dialog.plan} horses={horses} onClose={() => setDialog(null)} onDone={() => void loadPlans()} />
      )}
    </div>
  );
}

interface DialogProps {
  plan: TrainingPlan;
  onClose: () => void;
  onDone: () => void;
}

/** DL-2.02 Kích hoạt: BE kiểm toàn bộ; nếu ngựa ở trạng thái y tế thì hỏi xác nhận đã trao đổi với VET. */
function ActivateDialog({ plan, onClose, onDone }: DialogProps) {
  const toast = useToast();
  const [moveHorse, setMoveHorse] = useState(plan.horseStatus === "RESTING");
  const [needVet, setNeedVet] = useState(false);
  const [vetConsulted, setVetConsulted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await trainingApi.activatePlan(plan.id, { moveHorseToTraining: moveHorse, vetConsulted });
      toast.show("Training plan activated.", "ok");
      onDone();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.code === "VET_CONFIRMATION_REQUIRED") setNeedVet(true);
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
          <Button tone="primary" onClick={() => void submit()} disabled={submitting || (needVet && !vetConsulted)}>
            Activate
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ margin: 0, fontSize: "0.875rem" }}>
          The system checks: no Training Lock, horse still managed, no other active plan for {plan.horseName}, at least one
          workout, and end date not passed.
        </p>
        {error && <Alert tone={needVet ? "warn" : "danger"} title="Cannot activate yet">{error}</Alert>}
        {plan.horseStatus === "RESTING" && (
          <Checkbox label="Also move the horse from Resting to In Training" checked={moveHorse} onChange={setMoveHorse} />
        )}
        {needVet && (
          <Checkbox label="I have discussed this plan with the Veterinarian" checked={vetConsulted} onChange={setVetConsulted} />
        )}
      </div>
    </Modal>
  );
}

/** DL-2.04 Hoàn thành (nhận xét 10-2000) và DL-2.03 Hủy (lý do 10-500). */
function CloseDialog({ kind, plan, onClose, onDone }: DialogProps & { kind: "complete" | "cancel" }) {
  const toast = useToast();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const min = 10;
  const max = kind === "complete" ? 2000 : 500;
  const len = text.trim().length;

  const submit = async () => {
    setSubmitting(true);
    try {
      if (kind === "complete") await trainingApi.completePlan(plan.id, text.trim());
      else await trainingApi.cancelPlan(plan.id, text.trim());
      toast.show(kind === "complete" ? "Training plan completed." : "Training plan cancelled.", "ok");
      onDone();
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
          <Button
            tone={kind === "cancel" ? "danger" : "primary"}
            onClick={() => void submit()}
            disabled={submitting || len < min || len > max}
          >
            {kind === "complete" ? "Complete plan" : "Cancel plan"}
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ margin: 0, fontSize: "0.875rem" }}>
          Workouts that have not happened yet will be cancelled. Results of completed workouts are kept.
        </p>
        <Field label={kind === "complete" ? "Summary" : "Reason for cancelling"} required hint={`${min}-${max} characters`}>
          <Textarea rows={3} maxLength={max} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/** DL-2.08 Nhân bản giáo án sang ngựa khác (bản mới là Nháp). */
function CloneDialog({ plan, horses, onClose, onDone }: DialogProps & { horses: Horse[] }) {
  const toast = useToast();
  const [horseId, setHorseId] = useState(horses[0]?.id ?? "");
  const [name, setName] = useState(`${plan.name} (copy)`);
  const [startDate, setStartDate] = useState(todayClub());
  const [copyWorkouts, setCopyWorkouts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await trainingApi.clonePlan(plan.id, { targetHorseId: horseId, name: name.trim(), startDate, copyWorkouts });
      toast.show("Training plan copied as a new draft.", "ok");
      onDone();
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
          <Button
            tone="primary"
            onClick={() => void submit()}
            disabled={submitting || !horseId || name.trim().length < 3 || name.trim().length > 150}
          >
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
            options={horses.map((h) => ({
              value: h.id,
              label: `${h.name} (${h.horseCode ?? ""})${h.isMedicalLocked ? " – Training Lock 🔒" : ""}`,
            }))}
          />
        </Field>
        <Field label="New plan name" required hint="3-150 characters">
          <Input value={name} maxLength={150} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="New start date" required>
          <Input type="date" min={todayClub()} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Checkbox
          label="Copy workouts (dates shift with the new start date, results are not copied)"
          checked={copyWorkouts}
          onChange={setCopyWorkouts}
        />
      </div>
    </Modal>
  );
}
