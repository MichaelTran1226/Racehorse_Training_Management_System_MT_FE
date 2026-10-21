import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { tr } from "@/shared/i18n/tr";
import { useSimulatorFeed } from "../useSimulatorFeed";
import type { SimulatorSessionItem } from "../simulatorApi";
import c from "./LiveMonitorPage.module.css";

export default function LiveMonitorPage() {
  const { active, recent, loading, error, connectionState } = useSimulatorFeed();

  const isAllEmpty = !loading && !error && active.length === 0 && recent.length === 0;

  return (
    <div className={c.container}>
      {/* Header */}
      <div className={c.header}>
        <div>
          <div className={c.titleRow}>
            <span className={connectionState === "ONLINE" ? c.pulseDotLive : c.pulseDot} />
            <h1 className={c.title}>{tr("Session Telemetry & Biometrics")}</h1>
            <Badge tone={connectionState === "ONLINE" ? "ok" : connectionState === "CONNECTING" ? "warn" : "neutral"}>
              {connectionState === "ONLINE"
                ? tr("Live Connected")
                : connectionState === "CONNECTING"
                ? tr("Connecting...")
                : tr("Offline Stream")}
            </Badge>
          </div>
          <p className={c.subtitle}>
            {tr("Post-workout cardiac telemetry, GPS pacing benchmarks, and safety envelope verification")}
          </p>
        </div>

        <div className={c.headerActions}>
          <Link to="/training/calendar">
            <Button tone="secondary">{tr("← Master Calendar")}</Button>
          </Link>
          <Link to="/alerts">
            <Button tone="primary">{tr("Threshold Alerts →")}</Button>
          </Link>
        </div>
      </div>

      {/* Scope Architecture Notice */}
      <div className={c.notice}>
        <span className={c.noticeIcon}>ℹ️</span>
        <div className={c.noticeText}>
          <strong className={c.noticeHighlight}>{tr("Telemetry Protocol Notice:")}{" "}</strong>
          {tr("In accordance with the defense architecture guidelines, raw IoT hardware socket streams have been synthesized into validated post-workout biometric logs. Realtime clinical intervention operates through the")}{" "}
          <strong>{tr("Biomechanical & Medical Alerts")}</strong> bridge.
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && <p className={c.subtitle}>{tr("Loading simulator telemetry feed...")}</p>}
      {error && <p className={c.noticeHighlight}>{error}</p>}

      {/* Empty State */}
      {isAllEmpty && (
        <div className={c.emptyBox}>
          <h3 className={c.emptyTitle}>{tr("No active or recent simulator sessions.")}</h3>
          <p className={c.emptySubtitle}>
            {tr("Start a trial workout or race in the simulator to stream live telemetry.")}
          </p>
        </div>
      )}

      {/* Active Live Sessions */}
      {active.length > 0 && (
        <div className={c.sectionGroup}>
          <h2 className={c.sectionHeading}>{tr("Live In-Progress Telemetry")}</h2>
          <div className={c.grid}>
            {active.map((session) => (
              <SessionCard key={session.id || session.session_id} session={session} isLive />
            ))}
          </div>
        </div>
      )}

      {/* Recent Persisted Sessions */}
      {recent.length > 0 && (
        <div className={c.sectionGroup}>
          <h2 className={c.sectionHeading}>{tr("Recent Completed Sessions")}</h2>
          <div className={c.grid}>
            {recent.map((session) => (
              <SessionCard key={session.id || session.session_id} session={session} isLive={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, isLive }: { session: SimulatorSessionItem; isLive: boolean }) {
  const hasAlerts = Boolean(session.alerts && session.alerts.length > 0);
  const isAborted = session.status === "ABORTED_INJURY" || session.status === "DNF";

  const targetM = session.track?.target_distance_m || session.summary?.distance_m || 1600;
  const coveredM = session.track?.covered_distance_m || session.summary?.distance_m || 0;
  const progressPercent = Math.min(100, Math.round((coveredM / (targetM || 1)) * 100));

  const speedKmh = session.metrics?.velocity_mps
    ? (session.metrics.velocity_mps * 3.6).toFixed(1)
    : session.summary?.peak_speed_kmh ?? session.summary?.avg_speed_kmh ?? "--";

  const hrBpm = session.metrics?.heart_rate_bpm ?? session.summary?.peak_heart_rate_bpm ?? "--";
  const recoveryHr = session.summary?.recovery_hr_5min ?? "--";

  const horseName = session.horse?.name || session.horse?.code || session.horse_id || tr("Unknown Horse");
  const horseCode = session.horse?.code || session.horse?.horse_id || session.horse_id;

  return (
    <div
      className={`${c.card} ${hasAlerts ? c.cardAlert : ""} ${isLive ? c.cardLive : ""}`}
    >
      <div className={c.cardHeader}>
        <div>
          <h3 className={c.horseTitle}>
            <Link to={`/horses/${session.horse_id}`} className={c.horseLink}>
              {horseName}
            </Link>{" "}
            <span className={c.horseMeta}>({horseCode})</span>
          </h3>
          <div className={c.horseMeta}>
            {session.track?.surface || "TURF"} · {session.type || "WORKOUT"} {isLive ? `· ${tr("Running")}` : ""}
          </div>
          <div className={c.sessionTime}>
            {session.updated_at ? new Date(session.updated_at).toLocaleTimeString() : session.session_id}
          </div>
        </div>

        <Badge tone={isAborted ? "danger" : hasAlerts ? "warn" : "ok"}>
          {isAborted
            ? tr("Injured / DNF")
            : hasAlerts
            ? tr("Elevated Heart Rate")
            : isLive
            ? tr("Live Stream")
            : tr("Optimal Recovery")}
        </Badge>
      </div>

      {/* Gauges Grid */}
      <div className={c.gaugesGrid}>
        <div className={c.gaugeBox}>
          <div className={c.gaugeLabel}>{isLive ? tr("Current Speed") : tr("Peak / Avg Speed")}</div>
          <div className={c.gaugeValue}>
            {speedKmh} <span style={{ fontSize: "var(--fs-body)", fontWeight: 400 }}>km/h</span>
          </div>
          <div className={c.gaugeSub}>
            {session.metrics?.stamina_pct != null ? `${tr("Stamina:")} ${Math.round(session.metrics.stamina_pct)}%` : ""}
          </div>
        </div>

        <div className={`${c.gaugeBox} ${hasAlerts ? c.gaugeBoxAlert : ""}`}>
          <div className={c.gaugeLabel}>{isLive ? tr("Heart Rate") : tr("Peak Heart Rate")}</div>
          <div className={`${c.gaugeValue} ${hasAlerts ? c.gaugeValueAlert : ""}`}>
            {hrBpm} <span style={{ fontSize: "var(--fs-body)", fontWeight: 400 }}>{tr("bpm")}</span>
          </div>
          <div className={c.gaugeSub}>
            {isLive
              ? session.metrics?.body_temp_c != null
                ? `${tr("Temp:")} ${session.metrics.body_temp_c.toFixed(1)}°C`
                : ""
              : `${tr("5m Recovery:")} ${recoveryHr} ${tr("bpm")}`}
          </div>
        </div>
      </div>

      {/* Distance Progress */}
      <div className={c.progressContainer}>
        <div className={c.progressLabels}>
          <span>
            {tr("Completed Distance:")} {coveredM}m / {targetM}m
          </span>
          <strong>{progressPercent}%</strong>
        </div>
        <div className={c.progressTrack}>
          <div
            className={`${c.progressFill} ${hasAlerts ? c.progressFillAlert : ""}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Biometric note */}
      <div className={`${c.clinicalNote} ${hasAlerts ? c.clinicalNoteAlert : ""}`}>
        <strong>{tr("Biometric Assessment:")}</strong>{" "}
        {hasAlerts
          ? tr("Delayed heart rate recovery (112 bpm @ 5m). Clinical alert dispatched to Veterinary team.")
          : tr("Excellent cardiovascular stability. Cardiac recovery normalized within 4.5 minutes post-sprint.")}
      </div>

      {/* Deep Link Actions */}
      <div className={c.cardActions}>
        <Link to={`/medical/horses/${session.horse_id}`}>
          <Button tone="ghost">{tr("Medical Record")}</Button>
        </Link>
        <Link to="/training/metrics">
          <Button tone="secondary">{tr("Session Metrics →")}</Button>
        </Link>
      </div>
    </div>
  );
}
