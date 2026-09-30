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
    code: "GA-2026-000",
    name: "Giáo án Thích ứng Mùa Hè 2026",
    horseName: "Thần Gió (Thunderbolt)",
    duration: "01/07/2026 - 15/08/2026 (45 ngày)",
    targetMeters: 1600,
    initialSpeed: 42.0,
    finalSpeed: 47.8,
    initialHeartRate: 168,
    finalHeartRate: 154,
    outcome: "Đạt chuẩn phong độ, tốc độ nước rút tăng 5.8 km/h, nhịp tim ổn định.",
    status: "COMPLETED",
  },
  {
    id: "arch-2",
    code: "GA-2026-H1",
    name: "Huấn luyện bứt tốc xuất phát Barrier",
    horseName: "Hắc Báo (Black Panther)",
    duration: "10/06/2026 - 25/07/2026 (45 ngày)",
    targetMeters: 1200,
    initialSpeed: 44.5,
    finalSpeed: 50.2,
    initialHeartRate: 172,
    finalHeartRate: 160,
    outcome: "Cải thiện đáng kể độ trễ phản xạ xuất phát barrier dưới 1.2s.",
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
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Lịch Sử Giáo Án & Tiến Trình Huấn Luyện (SC-2.09)</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Lưu trữ tổng kết các kỳ giáo án đã hoàn thành, so sánh chỉ số trước & sau chu kỳ huấn luyện (P2-06)
          </p>
        </div>

        <Link to="/training/plans">
          <Button tone="secondary">← Danh Sách Giáo Án</Button>
        </Link>
      </div>

      {/* Filter */}
      <Card pad={16}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Lọc theo ngựa:</span>
          <div style={{ width: 280 }}>
            <Select
              value={selectedHorse}
              onChange={(e) => setSelectedHorse(e.target.value)}
              options={[
                { value: "ALL", label: "Tất cả đàn ngựa" },
                { value: "Thần Gió", label: "Thần Gió (Thunderbolt)" },
                { value: "Hắc Báo", label: "Hắc Báo (Black Panther)" },
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
                  <Badge tone="ok">Đã hoàn thành</Badge>
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Ngựa: <strong>{item.horseName}</strong> · Chu kỳ: {item.duration} · Cự ly {item.targetMeters}m
                </div>
              </div>
            </div>

            {/* Metrics comparison */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div style={{ padding: "0.75rem", background: "var(--surface-sunken)", borderRadius: 6 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Tốc độ bứt tốc: Trước → Sau</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--accent)", marginTop: 4 }}>
                  {item.initialSpeed} km/h → {item.finalSpeed} km/h
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--ok)", marginTop: 2 }}>
                  ↑ Tăng +{(item.finalSpeed - item.initialSpeed).toFixed(1)} km/h
                </div>
              </div>

              <div style={{ padding: "0.75rem", background: "var(--surface-sunken)", borderRadius: 6 }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Nhịp tim đỉnh: Trước → Sau</div>
                <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--warn)", marginTop: 4 }}>
                  {item.initialHeartRate} bpm → {item.finalHeartRate} bpm
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--ok)", marginTop: 2 }}>
                  ↓ Ổn định tốt hơn -{item.initialHeartRate - item.finalHeartRate} bpm
                </div>
              </div>
            </div>

            <div style={{ fontSize: "0.875rem", color: "var(--text-main)", background: "rgba(34, 197, 94, 0.05)", padding: "0.75rem", borderRadius: 6, border: "1px solid rgba(34, 197, 94, 0.2)" }}>
              <strong>Đánh giá tổng kết:</strong> {item.outcome}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
