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
    return <div className={styles.notes}>Chưa có thông số sinh tồn nào được ghi nhận.</div>;
  }

  const tempWarn = isTempWarning(vitals.temperature);
  const hrWarn = isHeartRateWarning(vitals.restingHeartRate);
  const rrWarn = isRespiratoryWarning(vitals.respiratoryRate);

  return (
    <div className={styles.container}>
      {recordedAt && (
        <div style={{ fontSize: "12px", color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="clock" size={14} />
          Ghi nhận lúc: {new Date(recordedAt).toLocaleString("vi-VN")}
        </div>
      )}

      <div className={styles.grid}>
        {/* Nhiệt độ */}
        <div className={cx(styles.vitalCard, tempWarn && styles.warning)}>
          <div className={styles.headerRow}>
            <span className={styles.vitalLabel}>Nhiệt độ</span>
            <Badge tone={tempWarn ? "danger" : "ok"} dot>
              {tempWarn ? "Ngoài ngưỡng" : "Bình thường"}
            </Badge>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{vitals.temperature !== undefined ? vitals.temperature.toFixed(1) : "—"}</span>
            <span className={styles.unit}>°C</span>
          </div>
          <span className={styles.reference}>Tham chiếu: 37.2 – 38.6 °C</span>
        </div>

        {/* Nhịp tim */}
        <div className={cx(styles.vitalCard, hrWarn && styles.warning)}>
          <div className={styles.headerRow}>
            <span className={styles.vitalLabel}>Nhịp tim lúc nghỉ</span>
            <Badge tone={hrWarn ? "danger" : "ok"} dot>
              {hrWarn ? "Ngoài ngưỡng" : "Bình thường"}
            </Badge>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{vitals.restingHeartRate ?? "—"}</span>
            <span className={styles.unit}>bpm</span>
          </div>
          <span className={styles.reference}>Tham chiếu: 28 – 44 bpm</span>
        </div>

        {/* Nhịp thở */}
        <div className={cx(styles.vitalCard, rrWarn && styles.warning)}>
          <div className={styles.headerRow}>
            <span className={styles.vitalLabel}>Nhịp thở</span>
            <Badge tone={rrWarn ? "danger" : "ok"} dot>
              {rrWarn ? "Ngoài ngưỡng" : "Bình thường"}
            </Badge>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{vitals.respiratoryRate ?? "—"}</span>
            <span className={styles.unit}>lần/phút</span>
          </div>
          <span className={styles.reference}>Tham chiếu: 8 – 16 lần/phút</span>
        </div>

        {/* Cân nặng */}
        <div className={styles.vitalCard}>
          <div className={styles.headerRow}>
            <span className={styles.vitalLabel}>Cân nặng</span>
            <Badge tone="neutral">Định kỳ</Badge>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.value}>{vitals.weightKg ?? "—"}</span>
            <span className={styles.unit}>kg</span>
          </div>
          <span className={styles.reference}>Chuẩn: 400 – 600 kg</span>
        </div>
      </div>

      {vitals.clinicalNotes && (
        <div className={styles.notes}>
          <strong>Ghi chú lâm sàng:</strong> {vitals.clinicalNotes}
        </div>
      )}

      {history && history.length > 0 && (
        <div className={styles.historySection}>
          <div className={styles.historyTitle}>
            <Icon name="trend" size={16} />
            Lịch sử 5 lần đo gần nhất
          </div>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Thời điểm</th>
                <th>Nhiệt độ (°C)</th>
                <th>Nhịp tim (bpm)</th>
                <th>Nhịp thở (lần/phút)</th>
                <th>Cân nặng (kg)</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td>{new Date(h.recordedAt).toLocaleDateString("vi-VN")}</td>
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
