import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";

interface LiveHorseTrack {
  id: string;
  name: string;
  jockey: string;
  track: string;
  speedKmh: number;
  heartRate: number;
  distanceCoveredMeters: number;
  targetMeters: number;
  status: "NORMAL" | "WARNING" | "CRITICAL";
}

export default function LiveMonitorPage() {
  const [horses, setHorses] = useState<LiveHorseTrack[]>([
    {
      id: "horse-1",
      name: "Thần Gió (Thunderbolt)",
      jockey: "Lê Hoàng Nài",
      track: "Sân cỏ - Làn 1",
      speedKmh: 46.4,
      heartRate: 154,
      distanceCoveredMeters: 1250,
      targetMeters: 1800,
      status: "NORMAL",
    },
    {
      id: "horse-3",
      name: "Hắc Báo (Black Panther)",
      jockey: "Đỗ Tuấn Kiệt",
      track: "Sân cát - Làn 2",
      speedKmh: 42.1,
      heartRate: 148,
      distanceCoveredMeters: 900,
      targetMeters: 1400,
      status: "NORMAL",
    },
    {
      id: "horse-4",
      name: "Hỏa Tiễn (Rocket)",
      jockey: "Vũ Tiến Đạt",
      track: "Sân cỏ - Làn 3",
      speedKmh: 49.8,
      heartRate: 182,
      distanceCoveredMeters: 1400,
      targetMeters: 1600,
      status: "WARNING",
    },
  ]);

  // Simulate subtle realtime pulse
  useEffect(() => {
    const timer = setInterval(() => {
      setHorses((prev) =>
        prev.map((h) => {
          const deltaSpeed = (Math.random() - 0.48) * 1.5;
          const deltaHr = Math.floor((Math.random() - 0.48) * 3);
          const newSpeed = Math.max(30, Math.min(58, +(h.speedKmh + deltaSpeed).toFixed(1)));
          const newHr = Math.max(120, Math.min(195, h.heartRate + deltaHr));
          const newStatus = newHr > 180 ? "WARNING" : "NORMAL";
          return {
            ...h,
            speedKmh: newSpeed,
            heartRate: newHr,
            distanceCoveredMeters: Math.min(h.targetMeters, h.distanceCoveredMeters + 15),
            status: newStatus,
          };
        }),
      );
    }, 2000);
    return () => clearInterval(timer);
  }, []);

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
                background: "var(--ok)",
                display: "inline-block",
                boxShadow: "0 0 8px var(--ok)",
              }}
            />
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Giám Sát Trực Tiếp Telemetry (SC-2.08)</h1>
          </div>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Theo dõi thời gian thực cảm biến nhịp tim, tốc độ GPS và phát hiện vượt ngưỡng an toàn trên đường chạy
          </p>
        </div>

        <Link to="/training/calendar">
          <Button tone="secondary">← Lịch Huấn Luyện</Button>
        </Link>
      </div>

      {/* Grid of live horses */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {horses.map((horse) => {
          const isWarning = horse.status === "WARNING";
          const progressPercent = Math.min(100, Math.round((horse.distanceCoveredMeters / horse.targetMeters) * 100));

          return (
            <div
              key={horse.id}
              style={{
                padding: "1.5rem",
                background: "var(--surface)",
                borderRadius: "var(--radius-card)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                border: isWarning ? "2px solid var(--danger)" : "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>{horse.name}</h3>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    Nài: <strong>{horse.jockey}</strong> · {horse.track}
                  </div>
                </div>

                <Badge tone={isWarning ? "danger" : "ok"}>
                  {isWarning ? "⚠️ Nhịp tim cao" : "Hoạt động bình thường"}
                </Badge>
              </div>

              {/* Big gauges */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ padding: "1rem", background: "var(--surface-sunken)", borderRadius: 8, textAlign: "center" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Tốc độ tức thời</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)", marginTop: "0.25rem" }}>
                    {horse.speedKmh} <span style={{ fontSize: "0.875rem", fontWeight: 400 }}>km/h</span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    background: isWarning ? "rgba(239, 68, 68, 0.1)" : "var(--surface-sunken)",
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Nhịp tim hiện tại</div>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: 800,
                      color: isWarning ? "var(--danger)" : "var(--text-main)",
                      marginTop: "0.25rem",
                    }}
                  >
                    {horse.heartRate} <span style={{ fontSize: "0.875rem", fontWeight: 400 }}>bpm</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "0.25rem" }}>
                  <span>Tiến độ cự ly: {horse.distanceCoveredMeters}m / {horse.targetMeters}m</span>
                  <strong>{progressPercent}%</strong>
                </div>
                <div style={{ height: 8, width: "100%", background: "var(--surface-sunken)", borderRadius: 4 }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${progressPercent}%`,
                      background: isWarning ? "var(--danger)" : "var(--ok)",
                      borderRadius: 4,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>

              {isWarning && (
                <div style={{ fontSize: "0.75rem", color: "var(--danger)", background: "rgba(239, 68, 68, 0.08)", padding: "0.5rem", borderRadius: 4 }}>
                  Cảnh báo: Nhịp tim vượt mức khuyến cáo 180 bpm! Đã gửi tín hiệu giảm tốc tới bộ đàm Nài ngựa.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
