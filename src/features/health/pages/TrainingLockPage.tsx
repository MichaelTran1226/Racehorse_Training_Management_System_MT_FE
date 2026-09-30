import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/form/Input";
import { Tabs } from "@/shared/components/ui/Tabs";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { healthApi } from "../api";
import { TrainingLockModal } from "../components/TrainingLockModal";
import type { TrainingLockHistoryItem } from "../types";

export default function TrainingLockPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isVet = user?.role === "VETERINARIAN" || user?.role === "CLUB_MANAGER";

  const [activeTab, setActiveTab] = useState<string>("ACTIVE");
  const [locks, setLocks] = useState<TrainingLockHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedLock, setSelectedLock] = useState<TrainingLockHistoryItem | null>(null);
  const [modalMode, setModalMode] = useState<"place" | "extend" | "lift" | null>(null);

  const loadLocks = useCallback(async () => {
    try {
      setLoading(true);
      // Giả lập danh sách tổng hợp khóa huấn luyện của đàn ngựa
      const data = await healthApi.getLocks();
      setLocks(data);
    } catch {
      toast.show("Không thể tải danh sách khóa huấn luyện", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadLocks();
  }, [loadLocks]);

  const filteredLocks = locks.filter((item) => {
    const matchesTab = activeTab === "ALL" ? true : item.status === activeTab;
    const matchesSearch =
      item.horseId.toLowerCase().includes(search.toLowerCase()) ||
      item.lockReason.toLowerCase().includes(search.toLowerCase()) ||
      item.lockCode.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Quản lý Khóa Huấn Luyện Y Tế</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Theo dõi, gia hạn và gỡ lệnh khóa tập luyện của ngựa chấn thương theo quy định thú y
          </p>
        </div>

        {isVet && (
          <Button
            tone="danger"
            onClick={() => {
              setSelectedLock(null);
              setModalMode("place");
            }}
          >
            + Đặt khóa huấn luyện mới
          </Button>
        )}
      </div>

      {/* Tabs & Controls */}
      <Card pad={16}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <Tabs
            items={[
              { id: "ACTIVE", label: `Đang hiệu lực (${locks.filter((l) => l.status === "ACTIVE").length})` },
              { id: "RELEASED", label: `Đã gỡ khóa (${locks.filter((l) => l.status === "RELEASED").length})` },
              { id: "ALL", label: `Tất cả (${locks.length})` },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <Input
              placeholder="Tìm mã khóa, lý do..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 260 }}
            />
          </div>
        </div>
      </Card>

      {/* Table list */}
      <Card>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Đang tải danh sách khóa...</div>
        ) : filteredLocks.length === 0 ? (
          <EmptyState
            title="Không có lệnh khóa huấn luyện nào"
            description="Hiện không có bản ghi khóa huấn luyện nào khớp với điều kiện lọc."
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Mã khóa</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Mã ngựa</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Trạng thái áp dụng</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Lý do y tế</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Ngày khóa</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Hạn xem xét</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Trạng thái</th>
                  {isVet && <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {filteredLocks.map((lock) => (
                  <tr key={lock.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{lock.lockCode}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Link to={`/medical/horses/${lock.horseId}`} style={{ color: "var(--accent)", textDecoration: "underline" }}>
                        {lock.horseId}
                      </Link>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Badge tone="danger">{lock.appliedMedicalStatus}</Badge>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", maxWidth: 280 }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={lock.lockReason}>
                        {lock.lockReason}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Bác sĩ: {lock.lockedBy}</span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>{lock.lockedAt}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span style={{ fontWeight: lock.status === "ACTIVE" ? 600 : 400, color: lock.status === "ACTIVE" ? "var(--warn)" : "inherit" }}>
                        {lock.reviewDate}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      {lock.status === "ACTIVE" ? (
                        <Badge tone="danger">Đang khóa</Badge>
                      ) : (
                        <Badge tone="neutral">Đã gỡ</Badge>
                      )}
                    </td>
                    {isVet && (
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                        {lock.status === "ACTIVE" ? (
                          <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                            <Button
                              tone="secondary"
                              onClick={() => {
                                setSelectedLock(lock);
                                setModalMode("extend");
                              }}
                            >
                              Gia hạn
                            </Button>
                            <Button
                              tone="accent"
                              onClick={() => {
                                setSelectedLock(lock);
                                setModalMode("lift");
                              }}
                            >
                              Gỡ khóa
                            </Button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Gỡ ngày {lock.releasedAt}</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Lock Modals */}
      {modalMode && (
        <TrainingLockModal
          horseName={selectedLock?.horseId || "Bạch Mã Hoàng Tử (horse-2)"}
          currentReviewDate={selectedLock?.reviewDate}
          mode={modalMode}
          onClose={() => {
            setModalMode(null);
            setSelectedLock(null);
          }}
          onPlaceLock={async () => {
            toast.show("Đã đặt khóa huấn luyện y tế thành công (DL-3.01)", "ok");
            setModalMode(null);
            setSelectedLock(null);
            void loadLocks();
          }}
          onLiftLock={async () => {
            toast.show("Đã gỡ khóa huấn luyện y tế thành công (DL-3.02)", "ok");
            setModalMode(null);
            setSelectedLock(null);
            void loadLocks();
          }}
          onExtendLock={async () => {
            toast.show("Đã gia hạn khóa huấn luyện y tế thành công (DL-3.03)", "ok");
            setModalMode(null);
            setSelectedLock(null);
            void loadLocks();
          }}
        />
      )}
    </div>
  );
}
