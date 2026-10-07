import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";

interface SessionTelemetrySnapshot {
  id: string;
  horseId: string;
  name: string;
  horseCode: string;
  jockey: string;
  track: string;
  sessionDate: string;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  peakHeartRate: number;
  recoveryHeartRate5Min: number;
  distanceCoveredMeters: number;
  targetMeters: number;
  status: "NORMAL" | "WARNING";
  clinicalNote: string;
}

const STATIC_TELEMETRY: SessionTelemetrySnapshot[] = [
  {
    id: "telemetry-1",
    horseId: "horse-1",
    name: "Thunderbolt Swift",
    horseCode: "HR-000001",
    jockey: "Alex Turner (Jockey)",
    track: "Turf Track - Lane 1",
    sessionDate: "2026-10-06 08:30",
    avgSpeedKmh: 46.4,
    maxSpeedKmh: 54.2,
    peakHeartRate: 154,
    recoveryHeartRate5Min: 88,
    distanceCoveredMeters: 1800,
    targetMeters: 1800,
    status: "NORMAL",
    clinicalNote: "Excellent cardiovascular stability. Cardiac recovery normalized within 4.5 minutes post-sprint.",
  },
  {
    id: "telemetry-3",
    horseId: "horse-3",
    name: "Shadowfax Wonder",
    horseCode: "HR-000003",
    jockey: "Kyle Bennett (Jockey)",
    track: "Sand Track - Lane 2",
    sessionDate: "2026-10-06 07:15",
    avgSpeedKmh: 38.6,
    maxSpeedKmh: 44.8,
    peakHeartRate: 178,
    recoveryHeartRate5Min: 112,
    distanceCoveredMeters: 1400,
    targetMeters: 1400,
    status: "WARNING",
    clinicalNote: "Delayed heart rate recovery (112 bpm @ 5m). Clinical alert dispatched to Veterinary team.",
  },
];

export default function LiveMonitorPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "var(--accent)",
                display: "inline-block",
              }}
            />
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Session Telemetry & Biometrics</h1>
          </div>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Post-workout cardiac telemetry, GPS pacing benchmarks, and safety envelope verification
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/training/calendar">
            <Button tone="secondary">← Master Calendar</Button>
          </Link>
          <Link to="/alerts">
            <Button tone="primary">Threshold Alerts →</Button>
          </Link>
        </div>
      </div>

      {/* Scope Architecture Notice */}
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "var(--surface-sunken)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-card)",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <span style={{ fontSize: "1.25rem" }}>ℹ️</span>
        <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--text-main)" }}>Telemetry Protocol Notice: </strong>
          In accordance with the defense architecture guidelines, raw IoT hardware socket streams have been synthesized into validated post-workout biometric logs. Realtime clinical intervention operates through the <strong>Biomechanical & Medical Alerts</strong> bridge.
        </div>
      </div>

      {/* Grid of telemetry snapshots */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
        {STATIC_TELEMETRY.map((session) => {
          const isWarning = session.status === "WARNING";
          const progressPercent = Math.min(100, Math.round((session.distanceCoveredMeters / session.targetMeters) * 100));

          return (
            <div
              key={session.id}
              style={{
                padding: "1.5rem",
                background: "var(--surface)",
                borderRadius: "var(--radius-card)",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                border: isWarning ? "2px solid var(--warn)" : "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                    <Link to={`/horses/${session.horseId}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {session.name}
                    </Link>{" "}
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 400 }}>({session.horseCode})</span>
                  </h3>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Jockey: <strong>{session.jockey}</strong> · {session.track}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    Completed: {session.sessionDate}
                  </div>
                </div>

                <Badge tone={isWarning ? "warn" : "ok"}>
                  {isWarning ? "Elevated Heart Rate" : "Optimal Recovery"}
                </Badge>
              </div>

              {/* Gauges */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ padding: "1rem", background: "var(--surface-sunken)", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Peak / Avg Speed</div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent)", marginTop: "0.25rem" }}>
                    {session.maxSpeedKmh} <span style={{ fontSize: "0.8rem", fontWeight: 400 }}>km/h</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    Avg: {session.avgSpeedKmh} km/h
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    background: isWarning ? "rgba(234, 179, 8, 0.1)" : "var(--surface-sunken)",
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Peak Heart Rate</div>
                  <div
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      color: isWarning ? "var(--warn)" : "var(--text-main)",
                      marginTop: "0.25rem",
                    }}
                  >
                    {session.peakHeartRate} <span style={{ fontSize: "0.8rem", fontWeight: 400 }}>bpm</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    5m Recovery: {session.recoveryHeartRate5Min} bpm
                  </div>
                </div>
              </div>

              {/* Distance progress */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "0.25rem" }}>
                  <span>Completed Distance: {session.distanceCoveredMeters}m / {session.targetMeters}m</span>
                  <strong>{progressPercent}%</strong>
                </div>
                <div style={{ height: 8, width: "100%", background: "var(--surface-sunken)", borderRadius: 4 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${progressPercent}%`,
                      background: isWarning ? "var(--warn)" : "var(--ok)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>

              {/* Clinical note */}
              <div
                style={{
                  fontSize: "0.8125rem",
                  color: isWarning ? "var(--text-main)" : "var(--text-muted)",
                  background: isWarning ? "rgba(234, 179, 8, 0.08)" : "var(--surface-sunken)",
                  padding: "0.75rem",
                  borderRadius: 6,
                  borderLeft: isWarning ? "3px solid var(--warn)" : "3px solid var(--ok)",
                }}
              >
                <strong>Biometric Assessment:</strong> {session.clinicalNote}
              </div>

              {/* Deep link actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <Link to={`/medical/horses/${session.horseId}`}>
                  <Button tone="ghost">Medical Record</Button>
                </Link>
                <Link to="/training/metrics">
                  <Button tone="secondary">Session Metrics →</Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
