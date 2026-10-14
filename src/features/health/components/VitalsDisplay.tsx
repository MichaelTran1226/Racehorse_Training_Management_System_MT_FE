import { Badge } from "@/shared/components/ui/Badge";
import { Icon } from "@/shared/components/ui/Icon";
import { cx } from "@/shared/lib/cx";
import type { VitalSigns } from "../types";
import styles from "./VitalsDisplay.module.css";
import { formatDate, formatDateTime } from "@/shared/lib/format";

import { tr } from "@/shared/i18n/tr";
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
    return <div className={styles.notes}>{tr("No vital signs recorded yet.")}</div>;
  }

  const tempWarn = isTempWarning(vitals.temperature);
  const hrWarn = isHeartRateWarning(vitals.restingHeartRate);
  const rrWarn = isRespiratoryWarning(vitals.respiratoryRate);

  return (
    <div className={styles.container}>
      {recordedAt && (
        <div style={{ fontSize: "var(--fs-caption)", color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="clock" size={14} />
          Recorded at: {formatDateTime(recordedAt)}
        </div>
      )}

      <div className={styles.grid}>
        {/* Temperature */}
        <div className={cx(styles.vitalCard, tempWarn && styles.warning)}>
          <div className={styles.headerRow}>
            <span className={styles.vitalLabel}>{tr("Temperature")}</span>
            <Badge tone={tempWarn ? "danger" : "ok"} dot>
              {tempWarn ? tr("Abnormal") : tr("Normal")}
            </Badge>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{vitals.temperature !== undefined ? vitals.temperature.toFixed(1) : "—"}</span>
            <span className={styles.unit}>°C</span>
          </div>
          <span className={styles.reference}>{tr("Reference: 37.2 – 38.6 °C")}</span>
        </div>

        {/* Resting Heart Rate */}
        <div className={cx(styles.vitalCard, hrWarn && styles.warning)}>
          <div className={styles.headerRow}>
            <span className={styles.vitalLabel}>{tr("Resting Heart Rate")}</span>
            <Badge tone={hrWarn ? "danger" : "ok"} dot>
              {hrWarn ? tr("Abnormal") : tr("Normal")}
            </Badge>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{vitals.restingHeartRate ?? "—"}</span>
            <span className={styles.unit}>bpm</span>
          </div>
          <span className={styles.reference}>{tr("Reference: 28 – 44 bpm")}</span>
        </div>

        {/* Respiratory Rate */}
        <div className={cx(styles.vitalCard, rrWarn && styles.warning)}>
          <div className={styles.headerRow}>
            <span className={styles.vitalLabel}>{tr("Respiratory Rate")}</span>
            <Badge tone={rrWarn ? "danger" : "ok"} dot>
              {rrWarn ? tr("Abnormal") : tr("Normal")}
            </Badge>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{vitals.respiratoryRate ?? "—"}</span>
            <span className={styles.unit}>breaths/min</span>
          </div>
          <span className={styles.reference}>{tr("Reference: 8 – 16 breaths/min")}</span>
        </div>

        {/* Weight */}
        <div className={styles.vitalCard}>
          <div className={styles.headerRow}>
            <span className={styles.vitalLabel}>{tr("Body Weight")}</span>
            <Badge tone="neutral">{tr("Routine")}</Badge>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{vitals.weightKg ?? "—"}</span>
            <span className={styles.unit}>kg</span>
          </div>
          <span className={styles.reference}>{tr("Standard: 400 – 600 kg")}</span>
        </div>
      </div>

      {vitals.clinicalNotes && (
        <div className={styles.notes}>
          <strong>{tr("Clinical Notes:")}</strong> {vitals.clinicalNotes}
        </div>
      )}

      {history && history.length > 0 && (
        <div className={styles.historySection}>
          <div className={styles.historyTitle}>
            <Icon name="trend" size={16} />
            {tr("History of 5 Most Recent Readings")}
          </div>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>{tr("Recorded At")}</th>
                <th>{tr("Temperature (°C)")}</th>
                <th>{tr("Heart Rate (bpm)")}</th>
                <th>{tr("Respiratory Rate (breaths/min)")}</th>
                <th>{tr("Weight (kg)")}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td>{formatDate(h.recordedAt)}</td>
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
