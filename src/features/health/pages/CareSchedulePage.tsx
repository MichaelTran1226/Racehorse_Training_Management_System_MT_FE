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
import { healthApi } from "../api";
import type { PreventiveCareItem, PreventiveStatus } from "../types";

const CATEGORY_LABELS: Record<string, string> = {
  ALL: "Tất cả danh mục",
  VACCINATION: "Tiêm phòng (Vaccine)",
  DEWORMING: "Tẩy giun (Deworming)",
  FARRIER: "Chăm sóc móng (Farrier)",
  DENTAL: "Nha khoa (Dental)",
  GENERAL: "Khám định kỳ khác",
};

const STATUS_BADGES: Record<PreventiveStatus, { label: string; tone: "ok" | "warn" | "danger" | "neutral" }> = {
  UP_TO_DATE: { label: "Đã hoàn thành", tone: "ok" },
  DUE_SOON: { label: "Sắp tới hạn", tone: "warn" },
  OVERDUE: { label: "Quá hạn", tone: "danger" },
  NO_DATA: { label: "Chưa có dữ liệu", tone: "neutral" },
};

export default function CareSchedulePage() {
  const { user } = useAuth();
  const toast = useToast();
  const isVet = user?.role === "VETERINARIAN" || user?.role === "CLUB_MANAGER";

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [items, setItems] = useState<PreventiveCareItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  // Record Completion Modal (DL-3.12)
  const [selectedCare, setSelectedCare] = useState<PreventiveCareItem | null>(null);
  const [adminDate, setAdminDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [adminBy, setAdminBy] = useState<string>(user?.fullName || "");
  const [nextDue, setNextDue] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await healthApi.getCareSchedules();
      setItems(data);
    } catch {
      toast.show("Không thể tải lịch chăm sóc định kỳ", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleOpenCompleteModal = (care: PreventiveCareItem) => {
    setSelectedCare(care);
    setAdminDate(new Date().toISOString().split("T")[0]);
    setAdminBy(user?.fullName || "BS Thú y");
    const nextDate = new Date();
    if (care.category === "VACCINATION") nextDate.setMonth(nextDate.getMonth() + 6);
    else if (care.category === "DEWORMING") nextDate.setMonth(nextDate.getMonth() + 3);
    else if (care.category === "FARRIER") nextDate.setDate(nextDate.getDate() + 35);
    else nextDate.setFullYear(nextDate.getFullYear() + 1);
    setNextDue(nextDate.toISOString().split("T")[0]);
    setNotes("");
  };

  const handleSubmitComplete = async () => {
    if (!selectedCare) return;
    try {
      setSubmitting(true);
      await healthApi.recordCareCompletion(selectedCare.id, {
        administeredDate: adminDate,
        administeredBy: adminBy,
        nextDueDate: nextDue,
        notes,
      });
      toast.show(`Đã ghi nhận thực hiện: ${selectedCare.type}`, "ok");
      setSelectedCare(null);
      void loadData();
    } catch {
      toast.show("Lỗi ghi nhận thực hiện chăm sóc", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesTab =
      activeTab === "ALL"
        ? true
        : activeTab === "OVERDUE"
          ? item.status === "OVERDUE"
          : activeTab === "DUE_SOON"
            ? item.status === "DUE_SOON"
            : item.status === "UP_TO_DATE";

    const matchesCategory = selectedCategory === "ALL" ? true : item.category === selectedCategory;

    const matchesSearch =
      item.horseId.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(search.toLowerCase()));

    return matchesTab && matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Lịch Chăm Sóc Định Kỳ & Danh Mục</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Quản lý kế hoạch tiêm phòng, tẩy giun, gọt móng và chăm sóc nha khoa theo quy chuẩn thể thao (SC-3.07)
          </p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <Card pad={16}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <Tabs
              items={[
                { id: "ALL", label: `Tất cả (${items.length})` },
                { id: "OVERDUE", label: `Quá hạn (${items.filter((i) => i.status === "OVERDUE").length})` },
                { id: "DUE_SOON", label: `Sắp tới hạn (${items.filter((i) => i.status === "DUE_SOON").length})` },
                { id: "UP_TO_DATE", label: `Đã hoàn thành (${items.filter((i) => i.status === "UP_TO_DATE").length})` },
              ]}
              active={activeTab}
              onChange={setActiveTab}
            />

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: 220 }}>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  options={Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                />
              </div>

              <Input
                placeholder="Tìm loại dịch vụ, mã ngựa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 240 }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Đang tải lịch chăm sóc...</div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="Không tìm thấy lịch chăm sóc"
            description="Hiện không có bản ghi nào phù hợp với bộ lọc đã chọn."
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Dịch vụ chăm sóc</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Mã ngựa</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Phân loại</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Lần thực hiện gần nhất</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Ngày tới hạn</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Trạng thái</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Ghi chú</th>
                  {isVet && <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{item.type}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Link to={`/medical/horses/${item.horseId}`} style={{ color: "var(--accent)", textDecoration: "underline" }}>
                        {item.horseId}
                      </Link>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Badge tone="neutral">{CATEGORY_LABELS[item.category] || item.category}</Badge>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div>{item.lastAdministeredDate || "Chưa ghi nhận"}</div>
                      {item.administeredBy && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Bởi: {item.administeredBy}</div>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: item.status === "OVERDUE" ? 700 : 500 }}>
                      {item.dueDate}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Badge tone={STATUS_BADGES[item.status]?.tone || "neutral"}>
                        {STATUS_BADGES[item.status]?.label || item.status}
                      </Badge>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", maxWidth: 240, color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                      {item.notes || "—"}
                    </td>
                    {isVet && (
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                        <Button tone="primary" onClick={() => handleOpenCompleteModal(item)}>
                          Ghi nhận (DL-3.12)
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Record Completion Modal (DL-3.12) */}
      {selectedCare && (
        <Modal
          onClose={() => setSelectedCare(null)}
          title={`Ghi nhận thực hiện: ${selectedCare.type}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ padding: "0.75rem 1rem", background: "var(--surface-sunken)", borderRadius: 8, fontSize: "0.875rem" }}>
              <div><strong>Ngựa:</strong> {selectedCare.horseId}</div>
              <div><strong>Hạng mục:</strong> {selectedCare.type} ({CATEGORY_LABELS[selectedCare.category]})</div>
            </div>

            <Field label="Ngày thực hiện" required>
              <Input type="date" value={adminDate} onChange={(e) => setAdminDate(e.target.value)} />
            </Field>

            <Field label="Người thực hiện / Đơn vị thú y" required>
              <Input value={adminBy} onChange={(e) => setAdminBy(e.target.value)} placeholder="Ví dụ: Bác sĩ Thú y Trưởng" />
            </Field>

            <Field label="Ngày tới hạn kỳ tiếp theo" required hint="Hệ thống tự tính dựa trên chu kỳ quy định, có thể chỉnh tay">
              <Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
            </Field>

            <Field label="Ghi chú & Dấu hiệu phản ứng sau tiêm/chăm sóc">
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Tiêm bắp sâu, không sốt, phản xạ bình thường..."
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button tone="ghost" onClick={() => setSelectedCare(null)}>
                Hủy bỏ
              </Button>
              <Button tone="primary" onClick={() => void handleSubmitComplete()} disabled={submitting}>
                {submitting ? "Đang lưu..." : "Xác nhận hoàn thành"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
