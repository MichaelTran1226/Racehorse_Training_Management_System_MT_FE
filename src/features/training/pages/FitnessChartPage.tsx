import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert } from "@/shared/components/ui/Alert";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Pagination } from "@/shared/components/ui/Pagination";
import { messageFor } from "@/shared/lib/messages";
import { HEALTH_STATUS } from "@/shared/lib/status";
import type { HealthStatus } from "@/shared/types/enums";
import { clubParts, trainingApi } from "../api";
import { FitnessChart, SERIES_COLOR, SERIES_LABEL } from "../components/FitnessChart";
import type { FitnessSeries } from "../components/FitnessChart";
import { EXERCISE_TYPE_LABEL } from "../types";
import type { FitnessData } from "../types";

const RANGES = [4, 12, 26];
const PAGE_SIZE = 20;

function formatTime(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  return `${String(m).padStart(2, "0")}:${(seconds - m * 60).toFixed(1).padStart(4, "0")}`;
}

/** SC-2.07 Biểu đồ thể lực ngựa (CM, HT, VET, OWNER ngựa sở hữu). */
export default function FitnessChartPage() {
  const { id = "" } = useParams();
  const [weeks, setWeeks] = useState(12);
  const [series, setSeries] = useState<FitnessSeries[]>(["speed", "score"]);
  const [data, setData] = useState<FitnessData | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const latest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latest.current;
    setError("");
    try {
      const res = await trainingApi.getFitness(id, weeks);
      if (requestId === latest.current) {
        setData(res);
        setLoadedAt(Date.now());
      }
    } catch (err) {
      if (requestId === latest.current) setError(messageFor(err));
    }
  }, [id, weeks]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <Alert tone="danger" title="Could not load data">
        {error} <Button size="sm" tone="secondary" onClick={() => void load()}>Try again</Button>
      </Alert>
    );
  }
  if (!data) return <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading fitness data...</div>;

  const to = loadedAt;
  const from = to - weeks * 7 * 24 * 3600_000;
  const statusCfg = HEALTH_STATUS[data.horse.status as HealthStatus] ?? { label: data.horse.status, tone: "neutral" };
  const rows = [...data.points].reverse();
  const s = data.summary;
  const toggle = (k: FitnessSeries) => setSeries((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: "var(--fs-kpi)" }}>Fitness – {data.horse.name}</h1>
          <Badge tone={statusCfg.tone as never}>{statusCfg.label}</Badge>
          {data.horse.isMedicalLocked && <Badge tone="danger" icon="lock">Training Lock</Badge>}
        </div>
        <Link to={`/horses/${data.horse.id}`}><Button tone="secondary">Horse profile</Button></Link>
      </div>

      <Card pad={16}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {RANGES.map((w) => (
              <Button key={w} size="sm" tone={weeks === w ? "primary" : "secondary"} onClick={() => setWeeks(w)}>
                {w} weeks
              </Button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {(Object.keys(SERIES_LABEL) as FitnessSeries[]).map((k) => (
              <Button key={k} size="sm" tone={series.includes(k) ? "primary" : "ghost"} onClick={() => toggle(k)}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: SERIES_COLOR[k], marginRight: 6 }} />
                {SERIES_LABEL[k]}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <Card pad={16}>
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>Best average speed</div>
          <div style={{ fontSize: "var(--fs-kpi)", fontWeight: 700 }}>{s.bestAvgSpeed ? `${s.bestAvgSpeed.value} km/h` : "—"}</div>
          {s.bestAvgSpeed && <div style={{ fontSize: "var(--fs-caption)" }}>{clubParts(s.bestAvgSpeed.date).date}</div>}
        </Card>
        <Card pad={16}>
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>Avg performance (last 4)</div>
          <div style={{ fontSize: "var(--fs-kpi)", fontWeight: 700 }}>{s.avgScoreLast4 != null ? `${s.avgScoreLast4}/10` : "—"}</div>
        </Card>
        <Card pad={16}>
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>Avg HR after 10 min (last 4)</div>
          <div style={{ fontSize: "var(--fs-kpi)", fontWeight: 700 }}>{s.avgRecoveryLast4 != null ? `${s.avgRecoveryLast4} bpm` : "—"}</div>
        </Card>
        <Card pad={16}>
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>Load, last 7 days</div>
          <div style={{ fontSize: "var(--fs-kpi)", fontWeight: 700 }}>{s.load7d}</div>
          {s.loadChangePct != null && (
            <div style={{ fontSize: "var(--fs-caption)", color: s.loadChangePct > 30 ? "var(--warn)" : "var(--text-muted)" }}>
              {s.loadChangePct >= 0 ? "+" : ""}{s.loadChangePct}% vs 4-week average
            </div>
          )}
        </Card>
      </div>

      <Card pad={16}>
        {data.points.length === 0 ? (
          <EmptyState title="No completed workouts to chart yet." />
        ) : (
          <>
            <FitnessChart data={data} series={series} from={from} to={to} />
            {data.points.length < 3 && (
              <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>At least 3 workouts are needed to see a trend.</div>
            )}
            <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>Red bands: Training Lock periods. Click a point to open the result.</div>
          </>
        )}
      </Card>

      {rows.length > 0 && (
        <Card pad={16}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-body)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                  {["Date", "Type", "Distance", "Time", "Avg speed", "Peak HR", "HR 10 min", "Performance", "Load"].map((h) => (
                    <th key={h} style={{ padding: "0.6rem 0.75rem" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => (
                  <tr key={p.workoutId} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.6rem 0.75rem" }}>
                      <Link to={`/training/sessions/${p.workoutId}/result`}>{clubParts(p.date).date}</Link>
                      {p.hasAlert && <Badge tone="danger">!</Badge>}
                    </td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>{EXERCISE_TYPE_LABEL[p.workoutType] ?? p.workoutType}</td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>{p.distanceMeters} m</td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>{formatTime(p.timeSeconds)}</td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>{p.avgSpeedKmh ?? "—"}</td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>{p.maxHeartRate ?? "—"}</td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>{p.recoveryHeartRate ?? "—"}</td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>{p.performanceScore ?? "—"}</td>
                    <td style={{ padding: "0.6rem 0.75rem" }}>{p.load}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > PAGE_SIZE && <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} noun="workouts" onPage={setPage} />}
        </Card>
      )}
    </div>
  );
}
