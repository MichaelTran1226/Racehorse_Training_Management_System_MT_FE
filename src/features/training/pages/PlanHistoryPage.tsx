import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Select } from "@/shared/components/form/Select";
import { useToast } from "@/shared/components/ui/Toast";
import { messageFor } from "@/shared/lib/messages";
import { trainingApi } from "../api";
import type { TrainingPlan } from "../types";

import { tr } from "@/shared/i18n/tr";
/** Lịch sử giáo án: các giáo án Hoàn thành / Đã hủy (dữ liệu thật, không còn danh sách viết cứng). */
export default function PlanHistoryPage() {
  const toast = useToast();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [horseId, setHorseId] = useState("ALL");

  useEffect(() => {
    Promise.all([trainingApi.getPlans({ status: "COMPLETED" }), trainingApi.getPlans({ status: "CANCELLED" })])
      .then(([done, cancelled]) =>
        setPlans([...done, ...cancelled].sort((a, b) => b.endDate.localeCompare(a.endDate))),
      )
      .catch((err) => toast.show(messageFor(err), "danger"))
      .finally(() => setLoading(false));
  }, [toast]);

  const horses = [...new Map(plans.map((p) => [p.horseId, p.horseName])).entries()];
  const shown = plans.filter((p) => horseId === "ALL" || p.horseId === horseId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--fs-h1)", fontWeight: 700 }}>{tr("Plan History")}</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "var(--fs-body)" }}>
            {tr("Completed and cancelled training plans with the trainer's summary or reason.")}
          </p>
        </div>
        <Link to="/training/plans">
          <Button tone="secondary">{tr("← Training plans")}</Button>
        </Link>
      </div>

      <Card pad={16}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontWeight: 600, fontSize: "var(--fs-body)" }}>{tr("Horse:")}</span>
          <div style={{ width: 280 }}>
            <Select
              value={horseId}
              onChange={(e) => setHorseId(e.target.value)}
              options={[{ value: "ALL", label: "All horses" }, ...horses.map(([id, name]) => ({ value: id, label: name }))]}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>{tr("Loading history...")}</div>
      ) : shown.length === 0 ? (
        <EmptyState title={tr("No finished plans yet")} description={tr("Completed or cancelled plans appear here.")} />
      ) : (
        shown.map((p) => (
          <Card key={p.id} pad={20}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "var(--fs-section)", fontWeight: 700 }}>{p.name}</span>
              <Badge tone="neutral">{p.planCode}</Badge>
              <Badge tone={p.status === "COMPLETED" ? "ok" : "danger"}>{p.status === "COMPLETED" ? tr("Completed") : tr("Cancelled")}</Badge>
            </div>
            <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {tr("Horse:")}{" "}<strong>{p.horseName}</strong> · {p.startDate} → {p.endDate} · {p.workoutCount} workout(s)
            </div>
            {(p.completionSummary || p.cancelledReason) && (
              <div style={{ fontSize: "var(--fs-body)", marginTop: "0.75rem", background: "var(--surface-sunken)", padding: "0.75rem", borderRadius: "var(--r-sm)" }}>
                <strong>{p.status === "COMPLETED" ? tr("Summary:") : tr("Reason:")}</strong> {p.completionSummary || p.cancelledReason}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
