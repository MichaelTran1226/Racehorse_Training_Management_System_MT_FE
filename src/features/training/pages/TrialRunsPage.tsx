import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { messageFor } from "@/shared/lib/messages";
import { todayClub, trainingApi } from "../api";
import { SESSION_STATUS_LABEL, TRACK_LABEL } from "../types";
import type { ExerciseSession } from "../types";

function plusDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Lượt chạy thử (tab của SC-2.05): mỗi lượt là một buổi tập loại "Trial run".
 * Lên lịch ở Lịch tập; hệ thống chặn 2 lượt trên cùng mặt sân trong khung 15 phút (Q-2.04).
 */
export default function TrialRunsPage() {
  const user = useCurrentUser();
  const toast = useToast();
  const [from, setFrom] = useState(todayClub());
  const [to, setTo] = useState(plusDays(todayClub(), 14));
  const [trials, setTrials] = useState<ExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);

  const latestRequest = useRef(0);
  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    try {
      const data = await trainingApi.getTrialRuns({ from, to });
      if (requestId === latestRequest.current) setTrials(data);
    } catch (err) {
      if (requestId === latestRequest.current) toast.show(messageFor(err), "danger");
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [from, to, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // Nhóm theo ngày + mặt sân để điều phối.
  const groups = new Map<string, ExerciseSession[]>();
  for (const t of trials) {
    const key = `${t.sessionDate} · ${TRACK_LABEL[t.trackType]}`;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--fs-h1)", fontWeight: 700 }}>Trial Runs</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "var(--fs-body)" }}>
            One trial run per track surface in any 15-minute window. Schedule them from the training schedule (type “Trial run”).
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/training/calendar">
            <Button tone={user.role === "HEAD_TRAINER" ? "primary" : "secondary"}>
              {user.role === "HEAD_TRAINER" ? "+ Schedule in calendar" : "← Schedule"}
            </Button>
          </Link>
        </div>
      </div>

      <Card pad={16}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Field label="From">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </Card>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading trial runs...</div>
      ) : trials.length === 0 ? (
        <EmptyState title="No trial runs in this period" description="Trial runs appear here once they are scheduled." />
      ) : (
        [...groups.entries()].map(([key, rows]) => (
          <Card key={key} pad={20}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "var(--fs-body-lg)" }}>{key}</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-body)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Time</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Horse</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Jockey</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Distance / target</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.5rem 0.75rem", fontWeight: 700 }}>{t.startTime}</td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>
                        <Link to={`/horses/${t.horseId}`}>{t.horseName}</Link>
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>{t.jockeyName || "—"}</td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>
                        {t.targetDistanceMeters}m{t.targetSpeedKmh ? ` · ${t.targetSpeedKmh} km/h` : ""}
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>
                        <Badge tone={t.status === "BLOCKED" ? "danger" : t.status === "COMPLETED" ? "ok" : "info"}>
                          {SESSION_STATUS_LABEL[t.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
