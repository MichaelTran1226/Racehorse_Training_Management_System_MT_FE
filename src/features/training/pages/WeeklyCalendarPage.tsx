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
import { Tabs } from "@/shared/components/ui/Tabs";
import { Textarea } from "@/shared/components/form/Textarea";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { getStoredHorses, getStoredLocks } from "@/shared/mock/horsesData";
import { trainingApi } from "../api";
import type { ExerciseIntensity, ExerciseSession, ExerciseType, TrackType } from "../types";

const INTENSITY_COLORS: Record<ExerciseIntensity, "ok" | "warn" | "danger"> = {
  LIGHT: "ok",
  MODERATE: "warn",
  HEAVY: "danger",
};

export default function WeeklyCalendarPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isTrainer = user?.role === "HEAD_TRAINER" || user?.role === "CLUB_MANAGER";

  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeDate, setActiveDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [filterIntensity, setFilterIntensity] = useState<string>("ALL");

  // Create Session Modal (DL-2.01)
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newHorseId, setNewHorseId] = useState<string>("horse-1");
  const [newType, setNewType] = useState<ExerciseType>("TROT");
  const [newIntensity, setNewIntensity] = useState<ExerciseIntensity>("MODERATE");
  const [newStart, setNewStart] = useState<string>("06:30");
  const [newEnd, setNewEnd] = useState<string>("07:30");
  const [newGroom, setNewGroom] = useState<string>("Trần Văn Chăm (Groom)");
  const [newJockey, setNewJockey] = useState<string>("Lê Hoàng Nài (Jockey)");
  const [newTrack, setNewTrack] = useState<TrackType>("TURF");
  const [newDistance, setNewDistance] = useState<number>(1200);
  const [newNotes, setNewNotes] = useState<string>("");

  const loadSessions = useCallback(async () => {
    try {
      const data = await trainingApi.getSessions();
      setSessions(data);
    } catch {
      toast.show("Không thể tải lịch tập huấn luyện", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let ignore = false;
    trainingApi
      .getSessions()
      .then((data) => {
        if (!ignore) {
          setSessions(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          toast.show("Không thể tải lịch tập huấn luyện", "danger");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [toast]);

  const storedHorses = getStoredHorses();
  const activeLocks = getStoredLocks().filter((l) => l.status === "ACTIVE");

  const defaultHorses = [
    { id: "horse-1", name: "Thần Gió (Thunderbolt)", code: "EQ-001" },
    { id: "horse-2", name: "Bạch Mã Hoàng Tử (Silver Arrow)", code: "EQ-002" },
    { id: "horse-3", name: "Hắc Báo (Black Panther)", code: "EQ-003" },
    { id: "horse-4", name: "Hỏa Tiễn (Rocket)", code: "EQ-004" },
  ];
  const availableHorses = storedHorses.length > 0 ? storedHorses : defaultHorses;
  const selectedHorse = availableHorses.find((h) => h.id === newHorseId) || availableHorses[0];
  const selectedHorseLock = activeLocks.find(
    (l) => l.horseId === newHorseId || (selectedHorse && l.horseName === selectedHorse.name)
  );

  const blockedCount = sessions.filter((s) => s.status === "BLOCKED_BY_LOCK").length;

  const handleRestoreSession = async (sessionId: string) => {
    try {
      await trainingApi.restoreBlockedSession(sessionId);
      toast.show("Đã khôi phục lịch tập sau khi gỡ khóa y tế", "ok");
      void loadSessions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khôi phục lịch tập";
      toast.show(msg, "danger");
    }
  };

  const handleCreateSession = async () => {
    try {
      const created = await trainingApi.createSession({
        horseId: newHorseId,
        horseName: selectedHorse ? selectedHorse.name : "Ngựa đua",
        sessionDate: activeDate,
        startTime: newStart,
        endTime: newEnd,
        sessionType: newType,
        intensity: newIntensity,
        groomName: newGroom,
        jockeyName: newJockey,
        trackType: newTrack,
        targetDistanceMeters: newDistance,
        notes: newNotes,
      });

      if (created.status === "BLOCKED_BY_LOCK") {
        toast.show(
          "Tự động chặn bài tập nặng: Ngựa đang có Khóa y tế từ Bác sĩ!",
          "danger",
        );
      } else {
        toast.show("Đã thêm buổi tập vào lịch thành công", "ok");
      }

      setIsCreateOpen(false);
      void loadSessions();
    } catch {
      toast.show("Lỗi tạo buổi tập", "danger");
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesIntensity = filterIntensity === "ALL" ? true : s.intensity === filterIntensity;
    return matchesIntensity;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Lịch Huấn Luyện & Phân Công</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Điều phối buổi tập theo khung giờ, phân công Groom/Jockey và tự động chặn bài tập nặng khi có Khóa y tế
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/training/trials">
            <Button tone="secondary">Điều phối Lượt Chạy Thử</Button>
          </Link>
          {isTrainer && (
            <Button tone="primary" onClick={() => setIsCreateOpen(true)}>
              + Xếp lịch tập mới
            </Button>
          )}
        </div>
      </div>

      {/* Safety Alert Banner (Exception Path 2) */}
      {blockedCount > 0 && (
        <div
          style={{
            padding: "0.85rem 1.25rem",
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid var(--danger)",
            borderRadius: "var(--radius-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--danger)", fontWeight: 600, fontSize: "0.875rem" }}>
            <span>⚠️ Dải Cảnh Báo An Toàn: Có <strong>{blockedCount}</strong> buổi tập tuần này bị chặn do Khóa huấn luyện y tế hiệu lực từ Bác sĩ.</span>
          </div>
          <Link to="/medical/locks">
            <Button tone="danger">Quản lý Khóa Huấn Luyện Thú Y →</Button>
          </Link>
        </div>
      )}

      {/* Control bar */}
      <Card pad={16}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Ngày xem:</span>
            <Input type="date" value={activeDate} onChange={(e) => setActiveDate(e.target.value)} style={{ width: 170 }} />
          </div>

          <Tabs
            items={[
              { id: "ALL", label: `Tất cả cường độ (${sessions.length})` },
              { id: "LIGHT", label: "Tập nhẹ (Light)" },
              { id: "MODERATE", label: "Trung bình (Moderate)" },
              { id: "HEAVY", label: "Bài tập nặng (Heavy)" },
            ]}
            active={filterIntensity}
            onChange={setFilterIntensity}
          />
        </div>
      </Card>

      {/* Session list / calendar tiles */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Đang tải lịch tập...</div>
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            title="Không có buổi tập nào"
            description="Chưa có buổi tập nào được xếp trong ngày hoặc bộ lọc đã chọn."
          />
        ) : (
          filteredSessions.map((session) => {
            const isBlocked = session.status === "BLOCKED_BY_LOCK";
            return (
              <div
                key={session.id}
                style={{
                  padding: "1.25rem",
                  background: isBlocked ? "rgba(239, 68, 68, 0.03)" : "var(--surface)",
                  borderRadius: "var(--radius-card)",
                  border: "1px solid var(--border)",
                  borderLeft: isBlocked ? "5px solid var(--danger)" : "5px solid var(--accent)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {/* Blocked banner if locked */}
                {isBlocked && (
                  <div
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: 6,
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid var(--danger)",
                      color: "var(--danger)",
                      fontSize: "0.875rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <strong>🔒 BỊ CHẶN BỞI KHÓA HUẤN LUYỆN Y TẾ:</strong> {session.blockedReason}
                    </div>
                    {isTrainer && (
                      <Button tone="danger" onClick={() => void handleRestoreSession(session.id)}>
                        Khôi phục lịch tập
                      </Button>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                        {session.startTime} – {session.endTime}
                      </span>
                      <Badge tone={INTENSITY_COLORS[session.intensity]}>
                        Cường độ {session.intensity} · {session.sessionType}
                      </Badge>
                      {session.status === "COMPLETED" && <Badge tone="ok">Đã hoàn thành</Badge>}
                      {session.status === "SCHEDULED" && <Badge tone="neutral">Đã lên lịch</Badge>}
                    </div>

                    <h3 style={{ margin: "0.5rem 0 0", fontSize: "1.25rem", fontWeight: 700 }}>
                      <Link to={`/medical/horses/${session.horseId}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {session.horseName}
                      </Link>
                    </h3>

                    {session.planName && (
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                        Giáo án: <strong>{session.planName}</strong>
                      </div>
                    )}
                  </div>

                  {/* Assignment pills */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem" }}>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Nhân sự chăm sóc:</span>{" "}
                      <strong>{session.groomName || "Chưa gán"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Nài ngựa (Jockey):</span>{" "}
                      <strong>{session.jockeyName || "Chưa gán"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)" }}>Mặt sân / Làn:</span>{" "}
                      <strong>
                        {session.trackType === "TURF" ? "Sân cỏ (Turf)" : "Sân cát (Sand)"} - Làn {session.lane || 1}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Result or Action button */}
                {session.result ? (
                  <div
                    style={{
                      padding: "0.75rem",
                      background: "var(--surface-sunken)",
                      borderRadius: 6,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      fontSize: "0.8125rem",
                    }}
                  >
                    <div>
                      <strong>Kết quả ghi nhận:</strong> Cự ly {session.result.actualDistanceMeters}m · Tốc độ max:{" "}
                      {session.result.maxSpeedKmh} km/h · Tim max: {session.result.maxHeartRate} bpm · Điểm phong độ:{" "}
                      <span style={{ color: "var(--accent)", fontWeight: 700 }}>{session.result.performanceScore}/10</span>
                    </div>
                    <Link to="/training/metrics">
                      <Button tone="ghost">Xem biểu đồ thể lực →</Button>
                    </Link>
                  </div>
                ) : (
                  !isBlocked && (
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.25rem" }}>
                      <Link to="/training/metrics">
                        <Button tone="primary">Ghi kết quả buổi tập</Button>
                      </Link>
                    </div>
                  )
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Session Modal */}
      {isCreateOpen && (
        <Modal onClose={() => setIsCreateOpen(false)} title="Xếp Lịch Tập Mới">
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Field label="Chọn ngựa huấn luyện" required>
              <Select
                value={newHorseId}
                onChange={(e) => setNewHorseId(e.target.value)}
                options={availableHorses.map((h) => {
                  const hasLock = activeLocks.some(
                    (l) => l.horseId === h.id || l.horseName === h.name
                  );
                  return {
                    value: h.id,
                    label: `${h.name} (${h.code || "H"}) ${hasLock ? "— Có Khóa Y Tế 🔒" : "— Sẵn sàng"}`,
                  };
                })}
              />
            </Field>

            {selectedHorseLock && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid var(--danger)",
                  borderRadius: 6,
                  fontSize: "0.8125rem",
                  color: "var(--danger)",
                }}
              >
                <strong>🔒 Lưu ý y tế:</strong> {selectedHorse?.name} đang có Khóa huấn luyện thú y ({selectedHorseLock.lockReason}). Các bài tập cường độ cao (Nặng / Canter / Gallop) sẽ bị hệ thống tự động khóa để bảo vệ an toàn cho ngựa!
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Bài tập" required>
                <Select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ExerciseType)}
                  options={[
                    { value: "WALK", label: "Đi bộ (Walk)" },
                    { value: "TROT", label: "Nước kiệu (Trot)" },
                    { value: "CANTER", label: "Phi nước kiệu chậm (Canter)" },
                    { value: "GALLOP", label: "Phi nước đại bứt tốc (Gallop)" },
                    { value: "GATE_PRACTICE", label: "Tập xuất phát barrier" },
                  ]}
                />
              </Field>

              <Field label="Cường độ" required>
                <Select
                  value={newIntensity}
                  onChange={(e) => setNewIntensity(e.target.value as ExerciseIntensity)}
                  options={[
                    { value: "LIGHT", label: "Nhẹ (Light)" },
                    { value: "MODERATE", label: "Trung bình (Moderate)" },
                    { value: "HEAVY", label: "Nặng (Heavy)" },
                  ]}
                />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Giờ bắt đầu" required>
                <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
              </Field>

              <Field label="Giờ kết thúc" required>
                <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Nhân sự chăm sóc phụ trách (Groom)" required>
                <Input value={newGroom} onChange={(e) => setNewGroom(e.target.value)} />
              </Field>

              <Field label="Nài ngựa điều khiển (Jockey)">
                <Input value={newJockey} onChange={(e) => setNewJockey(e.target.value)} />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Mặt sân" required>
                <Select
                  value={newTrack}
                  onChange={(e) => setNewTrack(e.target.value as TrackType)}
                  options={[
                    { value: "TURF", label: "Sân cỏ (Turf)" },
                    { value: "SAND", label: "Sân cát (Sand)" },
                  ]}
                />
              </Field>

              <Field label="Cự ly dự kiến (mét)">
                <Input
                  type="number"
                  value={newDistance}
                  onChange={(e) => setNewDistance(Number(e.target.value))}
                />
              </Field>
            </div>

            <Field label="Ghi chú & Chỉ đạo kỹ thuật">
              <Textarea
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Yêu cầu cụ thể cho lượt tập..."
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button tone="ghost" onClick={() => setIsCreateOpen(false)}>
                Hủy
              </Button>
              <Button tone="primary" onClick={() => void handleCreateSession()}>
                Lưu vào lịch tập
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
