import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Select } from "@/shared/components/form/Select";

interface ArchivedPlan {
  id: string;
  code: string;
  name: string;
  horseName: string;
  duration: string;
  targetMeters: number;
  initialSpeed: number;
  finalSpeed: number;
  initialHeartRate: number;
  finalHeartRate: number;
  outcome: string;
  status: "COMPLETED" | "CANCELLED";
}

const ARCHIVED_PLANS: ArchivedPlan[] = [
  {
    id: "arch-1",
    code: "PLAN-2026-000",
    name: "Summer Adaptation & Foundation Plan 2026",
    horseName: "Thunderbolt Swift",
    duration: "2026-07-01 - 2026-08-15 (45 days)",
    targetMeters: 1600,
    initialSpeed: 42.0,
    finalSpeed: 47.8,
    initialHeartRate: 168,
    finalHeartRate: 154,
    outcome: "Achieved benchmark conditioning: sprint speed improved by 5.8 km/h, cardiovascular recovery normalized.",
    status: "COMPLETED",
  },
  {
    id: "arch-2",
    code: "PLAN-2026-H1",
    name: "Starting Gate Reaction & Acceleration Conditioning",
    horseName: "Shadowfax Wonder",
    duration: "2026-06-10 - 2026-07-25 (45 days)",
    targetMeters: 1200,
    initialSpeed: 44.5,
    finalSpeed: 50.2,
    initialHeartRate: 172,
    finalHeartRate: 160,
    outcome: "Significantly improved starting barrier reaction latency below 1.2s with steady gait transition.",
    status: "COMPLETED",
  },
];

export default function PlanHistoryPage() {
  const [selectedHorse, setSelectedHorse] = useState<string>("ALL");

  const filtered = ARCHIVED_PLANS.filter((p) =>
    selectedHorse === "ALL" ? true : p.horseName.includes(selectedHorse),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Archived Plans & Conditioning History</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Review completed periodization cycles and compare pre vs post conditioning indicators
          </p>
        </div>

        <Link to="/training/plans">
          <Button tone="secondary">← Active Plans</Button>
        </Link>
      </div>

      {/* Filter */}
      <Card pad={16}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Filter by Horse:</span>
          <div style={{ width: 280 }}>
            <Select
              value={selectedHorse}
              onChange={(e) => setSelectedHorse(e.target.value)}
              options={[
                { value: "ALL", label: "All Racehorses" },
                { value: "Thunderbolt", label: "Thunderbolt Swift" },
                { value: "Shadowfax", label: "Shadowfax Wonder" },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* History Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            style={{
              padding: "1.5rem",
              background: "var(--surface)",
              borderRadius: "var(--radius-card)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>{item.name}</span>
                  <Badge tone="neutral">{item.code}</Badge>
                  <Badge tone="ok">Completed</Badge>
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Horse: <strong>{item.horseName}</strong> · Duration: {item.duration} · Distance: {item.targetMeters}m
                </div>
              </div>
            </div>

            {/* Metrics comparison */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div style={{ padding: "0.75rem", background: "var(--surface-sunken)", borderRadius: 6 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Sprint Speed: Baseline → Final</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--accent)", marginTop: 4 }}>
                  {item.initialSpeed} km/h → {item.finalSpeed} km/h
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--ok)", marginTop: 2 }}>
                  ↑ Improved +{(item.finalSpeed - item.initialSpeed).toFixed(1)} km/h
                </div>
              </div>

              <div style={{ padding: "0.75rem", background: "var(--surface-sunken)", borderRadius: 6 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Peak Heart Rate: Baseline → Final</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--warn)", marginTop: 4 }}>
                  {item.initialHeartRate} bpm → {item.finalHeartRate} bpm
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--ok)", marginTop: 2 }}>
                  ↓ Cardiac recovery -{item.initialHeartRate - item.finalHeartRate} bpm
                </div>
              </div>
            </div>

            <div style={{ fontSize: "0.875rem", color: "var(--text-main)", background: "rgba(34, 197, 94, 0.05)", padding: "0.75rem", borderRadius: 6, border: "1px solid rgba(34, 197, 94, 0.2)" }}>
              <strong>Cycle Evaluation:</strong> {item.outcome}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
