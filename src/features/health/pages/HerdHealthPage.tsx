import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/form/Input";
import { Tabs } from "@/shared/components/ui/Tabs";
import { useAuth } from "@/shared/components/layout/AuthProvider";

interface HerdHorse {
  id: string;
  name: string;
  code: string;
  stall: string;
  healthGroup: "FIT" | "WATCH" | "INJURED" | "QUARANTINED";
  statusText: string;
  isLocked: boolean;
  lockReason?: string;
  primaryDiagnosis?: string;
  restingHeartRate: number;
  temp: number;
}

const MOCK_HERD: HerdHorse[] = [
  {
    id: "horse-1",
    name: "Thần Gió (Thunderbolt)",
    code: "EQ-001",
    stall: "Ô A-01",
    healthGroup: "FIT",
    statusText: "Sẵn sàng thi đấu",
    isLocked: false,
    restingHeartRate: 34,
    temp: 37.8,
  },
  {
    id: "horse-2",
    name: "Bạch Mã Hoàng Tử (Silver Arrow)",
    code: "EQ-002",
    stall: "Ô A-02",
    healthGroup: "INJURED",
    statusText: "Chấn thương gân gấp",
    isLocked: true,
    lockReason: "Viêm gân gấp chi trước bên trái mức độ 2",
    primaryDiagnosis: "Desmitis chi trước T",
    restingHeartRate: 42,
    temp: 38.2,
  },
  {
    id: "horse-3",
    name: "Hắc Báo (Black Panther)",
    code: "EQ-003",
    stall: "Ô B-05",
    healthGroup: "FIT",
    statusText: "Đang tập luyện",
    isLocked: false,
    restingHeartRate: 36,
    temp: 37.6,
  },
  {
    id: "horse-4",
    name: "Hỏa Tiễn (Rocket)",
    code: "EQ-004",
    stall: "Ô C-12",
    healthGroup: "WATCH",
    statusText: "Cần theo dõi nhịp tim",
    isLocked: false,
    lockReason: "Hồi phục tim chậm sau cự ly 1600m",
    restingHeartRate: 44,
    temp: 38.0,
  },
  {
    id: "horse-5",
    name: "Phi Yến (Flying Swallow)",
    code: "EQ-005",
    stall: "Ô D-01",
    healthGroup: "QUARANTINED",
    statusText: "Cách ly dịch tễ",
    isLocked: true,
    lockReason: "Nghi sốt siêu vi đường hô hấp, đang chờ kết quả PCR",
    restingHeartRate: 48,
    temp: 39.1,
  },
  {
    id: "horse-6",
    name: "Đại Bàng Vàng (Golden Eagle)",
    code: "EQ-006",
    stall: "Ô B-02",
    healthGroup: "FIT",
    statusText: "Nghỉ ngơi định kỳ",
    isLocked: false,
    restingHeartRate: 35,
    temp: 37.7,
  },
];

const GROUP_CONFIG = {
  FIT: { label: "Đủ điều kiện", color: "var(--ok)", bg: "rgba(34, 197, 94, 0.1)", border: "var(--ok)" },
  WATCH: { label: "Cần theo dõi", color: "var(--warn)", bg: "rgba(234, 179, 8, 0.1)", border: "var(--warn)" },
  INJURED: { label: "Chấn thương", color: "var(--danger)", bg: "rgba(239, 68, 68, 0.1)", border: "var(--danger)" },
  QUARANTINED: { label: "Cách ly", color: "#a855f7", bg: "rgba(168, 85, 247, 0.1)", border: "#a855f7" },
};

export default function HerdHealthPage() {
  const { user } = useAuth();
  const isVet = user?.role === "VETERINARIAN" || user?.role === "CLUB_MANAGER";

  const [filterGroup, setFilterGroup] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  const filtered = MOCK_HERD.filter((h) => {
    const matchesGroup = filterGroup === "ALL" ? true : h.healthGroup === filterGroup;
    const matchesSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.code.toLowerCase().includes(search.toLowerCase()) ||
      h.stall.toLowerCase().includes(search.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Sơ Đồ Sức Khỏe Đàn Ngựa (SC-3.01)</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Ma trận phân nhóm sức khỏe 4 mã màu: Đủ điều kiện, Cần theo dõi, Chấn thương và Cách ly
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          {isVet && (
            <Link to="/medical/locks">
              <Button tone="secondary">Quản lý Khóa Huấn Luyện</Button>
            </Link>
          )}
          <Link to="/medical/preventive">
            <Button tone="primary">Lịch Chăm Sóc Định Kỳ</Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)", borderLeft: `4px solid ${GROUP_CONFIG.FIT.border}` }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Đủ điều kiện thi đấu / tập</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: GROUP_CONFIG.FIT.color }}>
            {MOCK_HERD.filter((h) => h.healthGroup === "FIT").length} con
          </div>
        </div>
        <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)", borderLeft: `4px solid ${GROUP_CONFIG.WATCH.border}` }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Cần theo dõi sức khỏe</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: GROUP_CONFIG.WATCH.color }}>
            {MOCK_HERD.filter((h) => h.healthGroup === "WATCH").length} con
          </div>
        </div>
        <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)", borderLeft: `4px solid ${GROUP_CONFIG.INJURED.border}` }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Chấn thương y tế</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: GROUP_CONFIG.INJURED.color }}>
            {MOCK_HERD.filter((h) => h.healthGroup === "INJURED").length} con
          </div>
        </div>
        <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)", borderLeft: `4px solid ${GROUP_CONFIG.QUARANTINED.border}` }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Khu vực cách ly dịch tễ</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: GROUP_CONFIG.QUARANTINED.color }}>
            {MOCK_HERD.filter((h) => h.healthGroup === "QUARANTINED").length} con
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card pad={16}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <Tabs
            items={[
              { id: "ALL", label: `Tất cả (${MOCK_HERD.length})` },
              { id: "FIT", label: `Đủ điều kiện (${MOCK_HERD.filter((h) => h.healthGroup === "FIT").length})` },
              { id: "WATCH", label: `Cần theo dõi (${MOCK_HERD.filter((h) => h.healthGroup === "WATCH").length})` },
              { id: "INJURED", label: `Chấn thương (${MOCK_HERD.filter((h) => h.healthGroup === "INJURED").length})` },
              { id: "QUARANTINED", label: `Cách ly (${MOCK_HERD.filter((h) => h.healthGroup === "QUARANTINED").length})` },
            ]}
            active={filterGroup}
            onChange={setFilterGroup}
          />

          <Input
            placeholder="Tìm theo tên ngựa, mã chip, ô chuồng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300 }}
          />
        </div>
      </Card>

      {/* Grid of Horse Health Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {filtered.map((horse) => {
          const cfg = GROUP_CONFIG[horse.healthGroup];
          return (
            <div
              key={horse.id}
              style={{
                padding: "1.25rem",
                background: "var(--surface)",
                borderRadius: "var(--radius-card)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                position: "relative",
                border: horse.isLocked ? "2px solid var(--danger)" : "1px solid var(--border)",
              }}
            >
              {horse.isLocked && (
                <div
                  style={{
                    position: "absolute",
                    top: "0.75rem",
                    right: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "var(--danger)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  🔒 KHÓA HUẤN LUYỆN
                </div>
              )}

              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
                    <Link to={`/medical/horses/${horse.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {horse.name}
                    </Link>
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{horse.code}</span>
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Ô chuồng: <strong>{horse.stall}</strong>
                </div>
              </div>

              {/* Status pill */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    borderRadius: 999,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: cfg.color,
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  {cfg.label}: {horse.statusText}
                </span>
              </div>

              {/* Vitals quick view */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  background: "var(--surface-sunken)",
                  borderRadius: 6,
                  fontSize: "0.8125rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Nhịp tim nghỉ:</span>{" "}
                  <strong>{horse.restingHeartRate} bpm</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Nhiệt độ:</span>{" "}
                  <strong>{horse.temp} °C</strong>
                </div>
              </div>

              {horse.lockReason && (
                <div style={{ fontSize: "0.75rem", color: "var(--danger)", background: "rgba(239, 68, 68, 0.05)", padding: "0.5rem", borderRadius: 4 }}>
                  <strong>Lý do:</strong> {horse.lockReason}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                <Link to={`/medical/horses/${horse.id}`} style={{ flex: 1 }}>
                  <Button tone="secondary" style={{ width: "100%" }}>
                    Hồ sơ y tế (6 tab)
                  </Button>
                </Link>
                <Link to={`/medical/horses/${horse.id}/injuries`}>
                  <Button tone="ghost">Mô hình 2D</Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
