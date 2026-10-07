import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { Select } from "@/shared/components/form/Select";
import { Tabs } from "@/shared/components/ui/Tabs";
import { Textarea } from "@/shared/components/form/Textarea";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { getStoredHorses } from "@/shared/mock/horsesData";
import { trainingApi } from "../api";
import type { PlanStatus, TrainingPlan } from "../types";
import { getHorses } from "@/features/horses/api";
import type { Horse } from "@/features/horses/types";

const STATUS_CONFIG: Record<PlanStatus, { label: string; tone: "ok" | "warn" | "danger" | "neutral" | "info" }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  ACTIVE: { label: "Active", tone: "ok" },
  COMPLETED: { label: "Completed", tone: "info" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
};

export default function PlanListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isTrainer = user?.role === "HEAD_TRAINER" || user?.role === "CLUB_MANAGER";

  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Cancel Modal (DL-2.03)
  const [cancellingPlan, setCancellingPlan] = useState<TrainingPlan | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");

  // Available horses from store
  const availableHorses = useMemo(() => getStoredHorses(), []);

  // Clone Modal (DL-2.05)
  const [cloningPlan, setCloningPlan] = useState<TrainingPlan | null>(null);
  const [cloneTargetHorse, setCloneTargetHorse] = useState<string>(() => availableHorses[0]?.id || "horse-1");

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const [data, horseData] = await Promise.all([
        trainingApi.getPlans(),
        getHorses({ limit: 100 }),
      ]);
      setPlans(data);
      const list = Array.isArray(horseData) ? horseData : (horseData as any).items || [];
      setHorses(list);
    } catch {
      toast.show("Unable to load training plan list", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const handleActivate = async (plan: TrainingPlan) => {
    try {
      await trainingApi.activatePlan(plan.id);
      toast.show(`Plan ${plan.planCode} activated successfully`, "ok");
      void loadPlans();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error activating training plan";
      toast.show(msg, "danger");
    }
  };

  const handleComplete = async (plan: TrainingPlan) => {
    try {
      await trainingApi.completePlan(plan.id);
      toast.show(`Plan ${plan.planCode} marked as completed`, "ok");
      void loadPlans();
    } catch {
      toast.show("Error completing training plan", "danger");
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingPlan || !cancelReason.trim()) return;
    try {
      await trainingApi.cancelPlan(cancellingPlan.id, cancelReason);
      toast.show(`Plan ${cancellingPlan.planCode} cancelled`, "ok");
      setCancellingPlan(null);
      setCancelReason("");
      void loadPlans();
    } catch {
      toast.show("Error cancelling training plan", "danger");
    }
  };

  const handleConfirmClone = async () => {
    if (!cloningPlan) return;
    try {
      const targetHorse = availableHorses.find((h) => h.id === cloneTargetHorse);
      const targetName = targetHorse?.name || "Racehorse";
      const cloned = await trainingApi.clonePlan(
        cloningPlan.id,
        cloneTargetHorse,
        targetName,
      );
      toast.show(`Training plan successfully cloned: ${cloned.planCode}`, "ok");
      setCloningPlan(null);
      void loadPlans();
    } catch {
      toast.show("Error cloning training plan", "danger");
    }
  };

  const filteredPlans = plans.filter((p) => {
    const matchesTab = activeTab === "ALL" ? true : p.status === activeTab;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.planCode.toLowerCase().includes(search.toLowerCase()) ||
      p.horseName.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Training Plans</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Manage periodized training cycles, sprint progressions, and clinical safety gates
          </p>
        </div>

        {isTrainer && (
          <Button tone="primary" onClick={() => navigate("/training/plans/new")}>
            + Create New Plan
          </Button>
        )}
      </div>

      {/* Tabs & Search */}
      <Card pad={16}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <Tabs
            items={[
              { id: "ALL", label: `All (${plans.length})` },
              { id: "ACTIVE", label: `Active (${plans.filter((p) => p.status === "ACTIVE").length})` },
              { id: "DRAFT", label: `Draft (${plans.filter((p) => p.status === "DRAFT").length})` },
              { id: "COMPLETED", label: `Completed (${plans.filter((p) => p.status === "COMPLETED").length})` },
              { id: "CANCELLED", label: `Cancelled (${plans.filter((p) => p.status === "CANCELLED").length})` },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />

          <Input
            placeholder="Search by plan name, code, or horse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300 }}
          />
        </div>
      </Card>

      {/* Plan list */}
      <Card>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading training plans...</div>
        ) : filteredPlans.length === 0 ? (
          <EmptyState
            title="No Training Plans Found"
            description="There are currently no training plans matching the filter criteria."
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Plan Code</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Plan Title</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Racehorse</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Schedule</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Phases</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{plan.planCode}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: 600 }}>{plan.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Target: {plan.targetDistanceMeters}m · {plan.target}
                      </div>
                      {plan.isLockedByMedical && (
                        <div style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.25rem", fontWeight: 600 }}>
                          🔒 Medical Lock Active - Heavy workouts blocked
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Link to={`/horses/${plan.horseId}`} style={{ color: "var(--accent)", textDecoration: "underline" }}>
                        {plan.horseName}
                      </Link>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div>{plan.startDate}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>to {plan.endDate}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Badge tone="neutral">{plan.phases.length} phases</Badge>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Badge tone={STATUS_CONFIG[plan.status].tone}>{STATUS_CONFIG[plan.status].label}</Badge>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {isTrainer && plan.status === "DRAFT" && (
                          <Button tone="primary" onClick={() => void handleActivate(plan)}>
                            Activate
                          </Button>
                        )}
                        {isTrainer && plan.status === "ACTIVE" && (
                          <Button tone="accent" onClick={() => void handleComplete(plan)}>
                            Complete
                          </Button>
                        )}
                        {isTrainer && (plan.status === "DRAFT" || plan.status === "ACTIVE") && (
                          <Button tone="danger" onClick={() => setCancellingPlan(plan)}>
                            Cancel
                          </Button>
                        )}
                        {isTrainer && (
                          <Button tone="secondary" onClick={() => setCloningPlan(plan)}>
                            Clone
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Cancel Modal (DL-2.03) */}
      {cancellingPlan && (
        <Modal onClose={() => setCancellingPlan(null)} title={`Cancel Plan: ${cancellingPlan.planCode}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "0.875rem" }}>
              Are you sure you want to cancel plan <strong>{cancellingPlan.name}</strong>? All pending workout sessions will
              be marked as Cancelled.
            </p>

            <Field label="Cancellation Reason" required hint="Minimum 10 characters">
              <Textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter detailed cancellation rationale..."
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <Button tone="ghost" onClick={() => setCancellingPlan(null)}>
                Dismiss
              </Button>
              <Button
                tone="danger"
                onClick={() => void handleConfirmCancel()}
                disabled={cancelReason.trim().length < 10}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Clone Modal (DL-2.05) */}
      {cloningPlan && (
        <Modal onClose={() => setCloningPlan(null)} title={`Clone Training Plan: ${cloningPlan.planCode}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "0.875rem" }}>
              The system will replicate phase structures, conditioning targets, and parameters into a new draft plan.
            </p>

            <Field label="Target Racehorse for Cloned Plan" required>
              <Select
                value={cloneTargetHorse}
                onChange={(e) => setCloneTargetHorse(e.target.value)}
                options={availableHorses.map((h) => ({
                  value: h.id,
                  label: `${h.name} (${h.code || h.horseCode})${h.isLocked ? " - Medical Lock 🔒" : ""}`,
                }))}
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <Button tone="ghost" onClick={() => setCloningPlan(null)}>
                Cancel
              </Button>
              <Button tone="primary" onClick={() => void handleConfirmClone()}>
                Clone Plan
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
