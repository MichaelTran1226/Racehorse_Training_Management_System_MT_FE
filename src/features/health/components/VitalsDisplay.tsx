import { Badge } from "@/shared/components/ui/Badge";
import { Icon } from "@/shared/components/ui/Icon";
import { cx } from "@/shared/lib/cx";
import type { VitalSigns } from "../types";
import styles from "./VitalsDisplay.module.css";

interface VitalsDisplayProps {
  vitals?: VitalSigns;
  history?: (VitalSigns & { recordedAt: string })[];
  recordedAt?: string;
}

export function isTempWarning(temp?: number): boolean {
  if (temp === undefined || temp === null) return false;
  return temp < 37.2 || temp > 38.6;
}

export function isHeartRateWarning(hr?: number): boolean {
  if (hr === undefined || hr === null) return false;
  return hr < 28 || hr > 44;
}

export function isRespiratoryWarning(rr?: number): boolean {
  if (rr === undefined || rr === null) return false;
  return rr < 8 || rr > 16;
}

export function VitalsDisplay({ vitals, history, recordedAt }: VitalsDisplayProps) {
  if (!vitals) {
    return <div className={styles.notes}>No vital signs recorded yet.</div>;
  }

  const tempWarn = isTempWarning(vitals.temperature);
  const hrWarn = isHeartRateWarning(vitals.restingHeartRate);
  const rrWarn = isRespiratoryWarning(vitals.respiratoryRate);

  return (
    <div className={styles.container}>
      {recordedAt && (
        <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="clock" size={14} />
          Recorded at: {new Date(recordedAt).toLocaleString("en-US")}
        </div>
      )}

      <div className={styles.grid}>
        {/* Temperature */}
        <div className={cx(styles.vitalCard, tempWarn && styles.warning)}>
          <div className={styles.headerRow}>
            <span className={styles.vitalLabel}>Temperature</span>
            <Badge tone={tempWarn ? "danger" : "ok"} dot>
              {tempWarn ? "Abnormal" : "Normal"}
            </Badge>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{vitals.temperature !== undefined ? vitals.temperature.toFixed(1) : "—"}</span>
            <span className={styles.unit}>°C</span>
          </div>
          <span className={styles.reference}>Reference: 37.2 – 38.6 °C</span>
        </div>

        {/* Resting Heart Rate */}
        <div className={cx(styles.vitalCard, hrWarn && styles.warning)}>
          <div className={styles.headerRow}>
            <span className={styles.vitalLabel}>Resting Heart Rate</span>
            <Badge tone={hrWarn ? "danger" : "ok"} dot>
              {hrWarn ? "Abnormal" : "Normal"}
            </Badge>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{vitals.restingHeartRate ?? "—"}</span>
            <span className={styles.unit}>bpm</span>
          </div>
          <span className={styles.reference}>Reference: 28 – 44 bpm</span>
        </div>

        {/* Respiratory Rate */}
        <div className={cx(styles.vitalCard, rrWarn && styles.warning)}>
          <div className={styles.headerRow}>
            <span className={styles.vitalLabel}>Respiratory Rate</span>
            <Badge tone={rrWarn ? "danger" : "ok"} dot>
              {rrWarn ? "Abnormal" : "Normal"}
            </Badge>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{vitals.respiratoryRate ?? "—"}</span>
            <span className={styles.unit}>breaths/min</span>
          </div>
          <span className={styles.reference}>Reference: 8 – 16 breaths/min</span>
        </div>

        {/* Weight */}
        <div className={styles.vitalCard}>
          <div className={styles.headerRow}>
            <span className={styles.vitalLabel}>Body Weight</span>
            <Badge tone="neutral">Routine</Badge>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{vitals.weightKg ?? "—"}</span>
            <span className={styles.unit}>kg</span>
          </div>
          <span className={styles.reference}>Standard: 400 – 600 kg</span>
        </div>
      </div>

      {vitals.clinicalNotes && (
        <div className={styles.notes}>
          <strong>Clinical Notes:</strong> {vitals.clinicalNotes}
        </div>
      )}

      {history && history.length > 0 && (
        <div className={styles.historySection}>
          <div className={styles.historyTitle}>
            <Icon name="trend" size={16} />
            History of 5 Most Recent Readings
          </div>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Recorded At</th>
                <th>Temperature (°C)</th>
                <th>Heart Rate (bpm)</th>
                <th>Respiratory Rate (breaths/min)</th>
                <th>Weight (kg)</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td>{new Date(h.recordedAt).toLocaleDateString("en-US")}</td>
                  <td className={isTempWarning(h.temperature) ? styles.abnormal : undefined}>
                    {h.temperature?.toFixed(1) ?? "—"}
                  </td>
                  <td className={isHeartRateWarning(h.restingHeartRate) ? styles.abnormal : undefined}>
                    {h.restingHeartRate ?? "—"}
                  </td>
                  <td className={isRespiratoryWarning(h.respiratoryRate) ? styles.abnormal : undefined}>
                    {h.respiratoryRate ?? "—"}
                  </td>
                  <td>{h.weightKg ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
