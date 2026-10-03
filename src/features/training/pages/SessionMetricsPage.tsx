import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Tabs } from "@/shared/components/ui/Tabs";
import { Textarea } from "@/shared/components/form/Textarea";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { trainingApi } from "../api";
import type { FitnessMetricPoint } from "../types";

export default function SessionMetricsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isTrainer = user?.role === "HEAD_TRAINER" || user?.role === "CLUB_MANAGER";

  const [activeTab, setActiveTab] = useState<string>("RECORD");
  const [metrics, setMetrics] = useState<FitnessMetricPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form Record Session Result (SC-2.06)
  const [selectedSessionId, setSelectedSessionId] = useState<string>("ses-102");
  const [actualDistance, setActualDistance] = useState<number>(1800);
  const [actualDuration, setActualDuration] = useState<number>(168);
  const [avgSpeed, setAvgSpeed] = useState<number>(38.5);
  const [maxSpeed, setMaxSpeed] = useState<number>(51.2);
  const [avgHeartRate, setAvgHeartRate] = useState<number>(142);
  const [maxHeartRate, setMaxHeartRate] = useState<number>(172);
  const [rec1Min, setRec1Min] = useState<number>(102);
  const [rec5Min, setRec5Min] = useState<number>(68);
  const [performanceScore, setPerformanceScore] = useState<number>(8.5);
  const [hasAbnormal, setHasAbnormal] = useState<boolean>(false);
  const [abnormalDesc, setAbnormalDesc] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await trainingApi.getFitnessMetrics("horse-1");
      setMetrics(data);
    } catch {
      toast.show("Không thể tải biểu đồ thể lực", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmitResult = async () => {
    try {
      setSubmitting(true);
      await trainingApi.saveSessionResult(selectedSessionId, {
        actualDistanceMeters: actualDistance,
        actualDurationSeconds: actualDuration,
        avgSpeedKmh: avgSpeed,
        maxSpeedKmh: maxSpeed,
        avgHeartRate,
        maxHeartRate,
        recoveryHeartRate1Min: rec1Min,
        recoveryHeartRate5Min: rec5Min,
        performanceScore,
        hasAbnormalSigns: hasAbnormal,
        abnormalSignsDescription: abnormalDesc,
        headTrainerFeedback: feedback,
      });

      if (hasAbnormal) {
        toast.show(
          "Đã lưu kết quả & TỰ ĐỘNG GỬI CẢNH BÁO Y TẾ TỚI BÁC SĨ THÚ Y (Flow 3)!",
          "danger",
        );
      } else {
        toast.show("Đã ghi nhận kết quả buổi tập thành công", "ok");
      }

      void loadData();
      setActiveTab("CHART");
    } catch {
      toast.show("Lỗi ghi nhận kết quả buổi tập", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Kết Quả Buổi Tập & Biểu Đồ Thể Lực</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Nhập chỉ số vận động, chấm điểm phong độ, kích hoạt cảnh báo thú y và theo dõi tiến trình hồi phục
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/training/alerts">
            <Button tone="secondary">Danh sách cảnh báo y tế</Button>
          </Link>
          <Link to="/training/calendar">
            <Button tone="ghost">← Lịch Tập</Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Card pad={16}>
        <Tabs
          items={[
            { id: "RECORD", label: "Ghi nhận kết quả" },
            { id: "CHART", label: "Biểu đồ xu hướng thể lực" },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </Card>

      {/* TAB 1: Ghi nhận kết quả */}
      {activeTab === "RECORD" && (
        <Card pad={24}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>Nhập Chỉ Số Vận Động Buổi Tập</h3>

            <Field label="Chọn buổi tập cần ghi kết quả" required>
              <Select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                options={[
                  { value: "ses-102", label: "06:00 - 07:15: Thần Gió (Thunderbolt) - Gallop Cỏ 1800m" },
                  { value: "ses-104", label: "16:00 - 16:30: Bạch Mã Hoàng Tử (Silver Arrow) - Walk 600m" },
                ]}
              />
            </Field>

          {/* Vận tốc và Cự ly */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <Field label="Cự ly hoàn thành (mét)" required>
              <Input
                type="number"
                value={actualDistance}
                onChange={(e) => setActualDistance(Number(e.target.value))}
              />
            </Field>

            <Field label="Thời gian chạy (giây)" required>
              <Input
                type="number"
                value={actualDuration}
                onChange={(e) => setActualDuration(Number(e.target.value))}
              />
            </Field>

            <Field label="Tốc độ TB (km/h)" required>
              <Input
                type="number"
                step="0.1"
                value={avgSpeed}
                onChange={(e) => setAvgSpeed(Number(e.target.value))}
              />
            </Field>

            <Field label="Tốc độ đỉnh max (km/h)" required>
              <Input
                type="number"
                step="0.1"
                value={maxSpeed}
                onChange={(e) => setMaxSpeed(Number(e.target.value))}
              />
            </Field>
          </div>

          {/* Nhịp tim telemetry */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <Field label="Nhịp tim trung bình (bpm)" required>
              <Input
                type="number"
                value={avgHeartRate}
                onChange={(e) => setAvgHeartRate(Number(e.target.value))}
              />
            </Field>

            <Field label="Nhịp tim đỉnh max (bpm)" required>
              <Input
                type="number"
                value={maxHeartRate}
                onChange={(e) => setMaxHeartRate(Number(e.target.value))}
              />
            </Field>

            <Field label="Nhịp tim sau 1 phút nghỉ (bpm)">
              <Input
                type="number"
                value={rec1Min}
                onChange={(e) => setRec1Min(Number(e.target.value))}
              />
            </Field>

            <Field label="Nhịp tim sau 5 phút nghỉ (bpm)">
              <Input
                type="number"
                value={rec5Min}
                onChange={(e) => setRec5Min(Number(e.target.value))}
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "1rem", alignItems: "flex-start" }}>
            <Field label="Điểm phong độ (1 - 10)" required hint="Đánh giá kỹ thuật & độ bền">
              <Input
                type="number"
                step="0.5"
                min={1}
                max={10}
                value={performanceScore}
                onChange={(e) => setPerformanceScore(Number(e.target.value))}
              />
            </Field>

            <Field label="Đánh giá & Nhận xét của Trưởng ban huấn luyện">
              <Textarea
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Nhận xét cảm giác bước chạy, phản xạ của ngựa..."
              />
            </Field>
          </div>

          {/* Abnormal signs checkbox -> Triggers Flow 3 Alert */}
          <div
            style={{
              padding: "1rem",
              borderRadius: 8,
              background: hasAbnormal ? "rgba(239, 68, 68, 0.08)" : "var(--surface-sunken)",
              border: hasAbnormal ? "1px solid var(--danger)" : "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <Checkbox
              label="Phát hiện dấu hiệu bất thường (bước đi khập khiễng, thở dốc bất thường, hồi phục tim chậm...)"
              checked={hasAbnormal}
              onChange={(checked) => setHasAbnormal(checked)}
            />

            {hasAbnormal && (
              <Field label="Mô tả chi tiết dấu hiệu bất thường" required hint="Thông tin này sẽ ngay lập tức được gửi sang Bác sĩ Thú y để khám sàng lọc">
                <Textarea
                  rows={3}
                  value={abnormalDesc}
                  onChange={(e) => setAbnormalDesc(e.target.value)}
                  placeholder="Ví dụ: Chân trước bên phải có biểu hiện chùn bước khi tiếp đất, nhịp thở sau 10 phút vẫn trên 40..."
                />
              </Field>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            {isTrainer && (
              <Button tone="primary" onClick={() => void handleSubmitResult()} disabled={submitting}>
                {submitting ? "Đang lưu..." : "Lưu kết quả buổi tập"}
              </Button>
            )}
          </div>
          </div>
        </Card>
      )}

      {/* TAB 2: Biểu đồ thể lực */}
      {activeTab === "CHART" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Progress summary card */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Tốc độ tối đa gần nhất</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent)" }}>48.2 km/h</div>
              <div style={{ fontSize: "0.75rem", color: "var(--ok)", marginTop: "0.25rem" }}>↑ +2.2 km/h so với tuần trước</div>
            </div>

            <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Nhịp tim đỉnh cao nhất</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--warn)" }}>162 bpm</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Trong vùng an toàn &lt; 180 bpm</div>
            </div>

            <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Chỉ số hồi phục thể lực</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--ok)" }}>86 / 100</div>
              <div style={{ fontSize: "0.75rem", color: "var(--ok)", marginTop: "0.25rem" }}>Hồi phục tim nhanh (Rất tốt)</div>
            </div>

            <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Điểm thể lực tổng hợp</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent)" }}>85 / 100</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Sẵn sàng cho cự ly 2000m</div>
            </div>
          </div>

          {/* Visual bar progression table */}
          <Card pad={24}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 700 }}>
              Tiến Trình 5 Buổi Huấn Luyện Gần Nhất
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                    <th style={{ padding: "0.75rem 1rem" }}>Ngày tập</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Bài tập</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Tốc độ TB / Max</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Nhịp tim TB / Đỉnh</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Điểm hồi phục</th>
                    <th style={{ padding: "0.75rem 1rem" }}>Điểm phong độ</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{m.date}</td>
                      <td style={{ padding: "0.75rem 1rem" }}>{m.sessionName}</td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 600 }}>{m.avgSpeedKmh}</span> / {m.maxSpeedKmh} km/h
                        </div>
                        {/* Speed bar visual */}
                        <div style={{ height: 4, width: 120, background: "var(--surface-sunken)", borderRadius: 2, marginTop: 4 }}>
                          <div style={{ height: "100%", width: `${(m.maxSpeedKmh / 60) * 100}%`, background: "var(--accent)", borderRadius: 2 }} />
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div>{m.avgHeartRate} / <strong>{m.maxHeartRate} bpm</strong></div>
                        <div style={{ height: 4, width: 120, background: "var(--surface-sunken)", borderRadius: 2, marginTop: 4 }}>
                          <div style={{ height: "100%", width: `${(m.maxHeartRate / 200) * 100}%`, background: "var(--warn)", borderRadius: 2 }} />
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <Badge tone="ok">{m.recoveryScore} / 100</Badge>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ fontWeight: 700, color: "var(--accent)" }}>{m.performanceScore}/10</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
