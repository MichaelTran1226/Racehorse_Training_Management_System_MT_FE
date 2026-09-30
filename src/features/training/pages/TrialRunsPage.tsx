import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { Select } from "@/shared/components/form/Select";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { trainingApi } from "../api";
import type { TrackType, TrialRunSchedule } from "../types";

export default function TrialRunsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isTrainer = user?.role === "HEAD_TRAINER" || user?.role === "CLUB_MANAGER";

  const [trials, setTrials] = useState<TrialRunSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Trial Modal (DL-2.06)
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [runDate, setRunDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [trackType, setTrackType] = useState<TrackType>("TURF");
  const [distance, setDistance] = useState<number>(1200);
  const [startTime, setStartTime] = useState<string>("07:00");
  const [notes, setNotes] = useState<string>("");

  const loadTrials = useCallback(async () => {
    try {
      setLoading(true);
      const data = await trainingApi.getTrialRuns();
      setTrials(data);
    } catch {
      toast.show("Không thể tải danh sách chạy thử", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadTrials();
  }, [loadTrials]);

  const handleCreateTrial = async () => {
    try {
      await trainingApi.createTrialRun({
        runDate,
        trackType,
        distanceMeters: distance,
        startTime,
        notes,
        horses: [
          { horseId: "horse-1", horseName: "Thần Gió (Thunderbolt)", jockeyName: "Lê Hoàng Nài", gateNumber: 1 },
          { horseId: "horse-3", horseName: "Hắc Báo (Black Panther)", jockeyName: "Đỗ Tuấn Kiệt", gateNumber: 2 },
        ],
      });
      toast.show("Đã tạo lượt chạy thử thành công (DL-2.06)", "ok");
      setIsOpenModal(false);
      void loadTrials();
    } catch {
      toast.show("Lỗi tạo lượt chạy thử", "danger");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Điều Phối Lượt Chạy Thử (SC-2.05 · DL-2.06)</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Sắp xếp thứ tự chạy thử theo mặt sân cỏ/cát, phân bổ cổng xuất phát và điều phối nài đua (P2-08)
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/training/calendar">
            <Button tone="secondary">← Lịch Tập Chung</Button>
          </Link>
          {isTrainer && (
            <Button tone="primary" onClick={() => setIsOpenModal(true)}>
              + Thêm lượt chạy thử (DL-2.06)
            </Button>
          )}
        </div>
      </div>

      {/* Trial Run List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Đang tải danh sách chạy thử...</div>
        ) : trials.length === 0 ? (
          <EmptyState
            title="Chưa có lượt chạy thử nào"
            description="Bấm 'Thêm lượt chạy thử' để điều phối đợt kiểm tra phong độ."
          />
        ) : (
          trials.map((trial) => (
            <div
              key={trial.id}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                      Lượt #{trial.orderNumber} · {trial.runCode}
                    </span>
                    <Badge tone={trial.trackType === "TURF" ? "ok" : "warn"}>
                      {trial.trackType === "TURF" ? "Sân cỏ (Turf)" : "Sân cát (Sand)"}
                    </Badge>
                    <Badge tone="neutral">{trial.distanceMeters}m</Badge>
                    <Badge tone={trial.status === "PENDING" ? "info" : "ok"}>
                      {trial.status === "PENDING" ? "Chờ xuất phát" : "Đã hoàn thành"}
                    </Badge>
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Ngày: <strong>{trial.runDate}</strong> · Giờ: <strong>{trial.startTime}</strong> · Điều phối:{" "}
                    <strong>{trial.coordinatorName}</strong>
                  </div>
                </div>

                {isTrainer && trial.status === "PENDING" && (
                  <Button tone="primary" onClick={() => toast.show("Đã kích hoạt giờ xuất phát!", "ok")}>
                    Bắt đầu chạy thử
                  </Button>
                )}
              </div>

              {trial.notes && (
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", background: "var(--surface-sunken)", padding: "0.5rem 0.75rem", borderRadius: 4 }}>
                  {trial.notes}
                </div>
              )}

              {/* Horse gate table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Cổng (Gate)</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Ngựa đua</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Nài ngựa (Jockey)</th>
                      <th style={{ padding: "0.5rem 0.75rem" }}>Thời gian hoàn thành</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trial.horses.map((entry) => (
                      <tr key={entry.horseId} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.5rem 0.75rem", fontWeight: 700, color: "var(--accent)" }}>
                          Cổng {entry.gateNumber}
                        </td>
                        <td style={{ padding: "0.5rem 0.75rem", fontWeight: 600 }}>{entry.horseName}</td>
                        <td style={{ padding: "0.5rem 0.75rem" }}>{entry.jockeyName}</td>
                        <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted)" }}>
                          {entry.timingSeconds ? `${entry.timingSeconds} giây` : "Chưa có"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal create */}
      {isOpenModal && (
        <Modal onClose={() => setIsOpenModal(false)} title="Thêm Lượt Chạy Thử Mới (DL-2.06)">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Ngày chạy thử" required>
                <Input type="date" value={runDate} onChange={(e) => setRunDate(e.target.value)} />
              </Field>

              <Field label="Giờ xuất phát" required>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Mặt sân chạy" required>
                <Select
                  value={trackType}
                  onChange={(e) => setTrackType(e.target.value as TrackType)}
                  options={[
                    { value: "TURF", label: "Sân cỏ tự nhiên (Turf)" },
                    { value: "SAND", label: "Sân cát (Sand)" },
                  ]}
                />
              </Field>

              <Field label="Cự ly chạy (mét)" required>
                <Input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  min={800}
                  max={2400}
                  step={200}
                />
              </Field>
            </div>

            <Field label="Ghi chú điều phối">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Mục đích đánh giá bứt tốc..." />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button tone="ghost" onClick={() => setIsOpenModal(false)}>
                Hủy
              </Button>
              <Button tone="primary" onClick={() => void handleCreateTrial()}>
                Tạo lượt chạy thử
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
