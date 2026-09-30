import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { listRecords } from "../api";
import type { MedicalRecord } from "../types";
import styles from "./MedicalRecordPage.module.css";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "DRAFT", label: "Bản nháp (Draft)" },
  { value: "OPEN", label: "Đang điều trị (Open)" },
  { value: "CLOSED", label: "Đã kết thúc (Closed)" },
];

export default function RecordListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const isVet = user?.role === "VETERINARIAN" || user?.role === "CLUB_MANAGER";

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRecords({
        search: search.trim() || undefined,
        status: status || undefined,
        page,
        limit: 15,
      });
      setRecords(res.records);
      setTotal(res.total);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    void fetchRecords();
  }, [fetchRecords]);

  return (
    <div className={styles.container}>
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <h1 className={styles.horseTitle}>Hồ sơ Bệnh án Điện tử (SC-3.09)</h1>
            <span style={{ fontSize: "14px", color: "var(--muted)" }}>
              Quản lý chẩn đoán, phác đồ điều trị, đơn thuốc và lịch sử tái khám của toàn bộ đàn ngựa.
            </span>
          </div>

          {isVet && (
            <div className={styles.actions}>
              <Button tone="primary" icon="plus" onClick={() => navigate("/medical/records/new")}>
                Tạo bệnh án mới
              </Button>
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 240px" }}>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã bệnh án, tên ngựa, chẩn đoán..."
            />
          </div>

          <div style={{ width: "200px" }}>
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <Button tone="ghost" onClick={() => { setSearch(""); setStatus(""); setPage(1); }}>
            Xóa bộ lọc
          </Button>
        </div>
      </div>

      {/* Main Records Table */}
      <div className={styles.sectionCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--muted)" }}>
            Hiển thị {records.length} trên tổng số {total} bệnh án
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
            Đang tải dữ liệu bệnh án...
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            title="Không tìm thấy bệnh án phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái."
          />
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Mã bệnh án</th>
                  <th>Chiến mã</th>
                  <th>Ngày khám</th>
                  <th>Loại khám</th>
                  <th>Chẩn đoán</th>
                  <th>Mức độ</th>
                  <th>Trạng thái</th>
                  <th>Bác sĩ phụ trách</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/medical/records/${r.id}`)}>
                    <td><strong>{r.recordNumber}</strong></td>
                    <td>{r.horseName || r.horseId}</td>
                    <td>{new Date(r.examinationDate).toLocaleDateString("vi-VN")}</td>
                    <td>{r.examinationType}</td>
                    <td>{r.diagnosis || "Chưa ghi nhận"}</td>
                    <td>
                      <Badge
                        tone={
                          r.severity === "CRITICAL" || r.severity === "SEVERE"
                            ? "danger"
                            : r.severity === "MODERATE"
                            ? "warn"
                            : "ok"
                        }
                      >
                        {r.severity || "—"}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        tone={r.status === "OPEN" ? "info" : r.status === "CLOSED" ? "ok" : "neutral"}
                        dot
                      >
                        {r.status === "OPEN" ? "Đang điều trị" : r.status === "CLOSED" ? "Đã kết thúc" : "Bản nháp"}
                      </Badge>
                    </td>
                    <td>{r.vetName || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
