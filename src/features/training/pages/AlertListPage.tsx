import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Field } from "@/shared/components/form/Field";
import { Modal } from "@/shared/components/ui/Modal";
import { Textarea } from "@/shared/components/form/Textarea";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { trainingApi } from "../api";
import type { TrainingAlert } from "../types";

export default function AlertListPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isVet = user?.role === "VETERINARIAN" || user?.role === "CLUB_MANAGER";

  const [alerts, setAlerts] = useState<TrainingAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Acknowledge Modal
  const [selectedAlert, setSelectedAlert] = useState<TrainingAlert | null>(null);
  const [vetNotes, setVetNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await trainingApi.getAlerts();
      setAlerts(data);
    } catch {
      toast.show("Không thể tải danh sách cảnh báo", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const handleConfirmAck = async () => {
    if (!selectedAlert || !vetNotes.trim()) return;
    try {
      setSubmitting(true);
      await trainingApi.acknowledgeAlert(selectedAlert.id, vetNotes);
      toast.show("Bác sĩ thú y đã xác nhận xử lý cảnh báo", "ok");
      setSelectedAlert(null);
      setVetNotes("");
      void loadAlerts();
    } catch {
      toast.show("Lỗi xác nhận cảnh báo", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Cảnh Báo Vận Động & Y Tế (SC-2.10)</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Kết nối trực tiếp giữa Buổi tập (Flow 2) và Đội ngũ Bác sĩ Thú y (Flow 3) khi phát hiện dấu hiệu bất thường
          </p>
        </div>

        <Link to="/training/calendar">
          <Button tone="secondary">← Lịch Tập</Button>
        </Link>
      </div>

      {/* Alert list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Đang tải cảnh báo...</div>
        ) : alerts.length === 0 ? (
          <EmptyState
            title="Không có cảnh báo nào"
            description="Hiện không có dấu hiệu bất thường nào được ghi nhận từ các buổi huấn luyện."
          />
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: "1.25rem",
                background: "var(--surface)",
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--border)",
                borderLeft: alert.acknowledgedByVet ? "4px solid var(--ok)" : "4px solid var(--danger)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Badge tone={alert.severity === "HIGH" || alert.severity === "CRITICAL" ? "danger" : "warn"}>
                    Mức độ {alert.severity}
                  </Badge>
                  <span style={{ fontWeight: 700, fontSize: "1.125rem" }}>
                    <Link to={`/medical/horses/${alert.horseId}`} style={{ color: "inherit", textDecoration: "none" }}>
                      {alert.horseName}
                    </Link>
                  </span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{alert.createdAt}</span>
                </div>

                <Badge tone={alert.acknowledgedByVet ? "ok" : "danger"}>
                  {alert.acknowledgedByVet ? "BS thú y đã xử lý" : "Chờ BS thú y phản hồi"}
                </Badge>
              </div>

              <div style={{ fontSize: "0.9375rem", color: "var(--text-main)" }}>
                {alert.message}
              </div>

              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                Người báo cáo: <strong>{alert.reportedBy}</strong> · Ngày tập: <strong>{alert.sessionDate}</strong>
              </div>

              {alert.vetNotes && (
                <div style={{ background: "var(--surface-sunken)", padding: "0.75rem", borderRadius: 6, fontSize: "0.875rem" }}>
                  <strong>Phản hồi từ Bác sĩ thú y:</strong> {alert.vetNotes}
                </div>
              )}

              {isVet && !alert.acknowledgedByVet && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <Button tone="primary" onClick={() => setSelectedAlert(alert)}>
                    Bác sĩ phản hồi & khám sàng lọc
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Acknowledge Modal */}
      {selectedAlert && (
        <Modal onClose={() => setSelectedAlert(null)} title={`Phản hồi y tế cho ${selectedAlert.horseName}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "var(--surface-sunken)", padding: "0.75rem", borderRadius: 6, fontSize: "0.875rem" }}>
              <strong>Dấu hiệu báo cáo:</strong> {selectedAlert.message}
            </div>

            <Field label="Ghi chú khám & Biện pháp can thiệp của Bác sĩ thú y" required>
              <Textarea
                rows={3}
                value={vetNotes}
                onChange={(e) => setVetNotes(e.target.value)}
                placeholder="Ví dụ: Đã siêu âm khớp gối, ghi nhận viêm nhẹ. Đã chỉ định chườm đá và đặt Khóa huấn luyện y tế 7 ngày..."
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <Button tone="ghost" onClick={() => setSelectedAlert(null)}>
                Hủy
              </Button>
              <Button
                tone="primary"
                onClick={() => void handleConfirmAck()}
                disabled={submitting || !vetNotes.trim()}
              >
                Xác nhận phản hồi
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
