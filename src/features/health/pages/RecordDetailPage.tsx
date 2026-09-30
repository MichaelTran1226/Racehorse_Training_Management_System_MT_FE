import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Icon } from "@/shared/components/ui/Icon";
import { Tabs } from "@/shared/components/ui/Tabs";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import {
  addFollowUp,
  addPrescription,
  addTreatmentPhase,
  closeRecord,
  deleteDraftRecord,
  finalizeRecord,
  getRecordDetail,
  reopenRecord,
  stopPrescription,
} from "../api";
import { AddFollowUpModal } from "../components/AddFollowUpModal";
import { AddPrescriptionModal } from "../components/AddPrescriptionModal";
import { AddTreatmentPhaseModal } from "../components/AddTreatmentPhaseModal";
import { CloseRecordModal } from "../components/CloseRecordModal";
import { FinalizeRecordModal } from "../components/FinalizeRecordModal";
import { StopPrescriptionModal } from "../components/StopPrescriptionModal";
import { VitalsDisplay } from "../components/VitalsDisplay";
import type { MedicalRecord, PrescriptionItem } from "../types";
import styles from "./MedicalRecordPage.module.css";

const RECORD_TABS = [
  { id: "diagnosis", label: "Khám & Chẩn đoán" },
  { id: "phases", label: "Phác đồ điều trị" },
  { id: "prescriptions", label: "Đơn thuốc" },
  { id: "followups", label: "Tái khám" },
];

export default function RecordDetailPage() {
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "diagnosis";
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [stoppingPrescription, setStoppingPrescription] = useState<PrescriptionItem | null>(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const isVet = user?.role === "VETERINARIAN" || user?.role === "CLUB_MANAGER";
  const isOwner = user?.role === "HORSE_OWNER";

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getRecordDetail(id);
      setRecord(res.record);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải chi tiết bệnh án.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  async function handleDeleteDraft() {
    if (!record || !window.confirm(`Xóa bản nháp bệnh án ${record.recordNumber}? Thao tác không thể hoàn tác.`)) {
      return;
    }
    try {
      await deleteDraftRecord(record.id);
      toast.show("Đã xóa bản nháp bệnh án.", "ok");
      navigate(`/medical/horses/${record.horseId}`);
    } catch {
      toast.show("Lỗi khi xóa bản nháp.", "danger");
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
          Đang tải chi tiết bệnh án...
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className={styles.container}>
        <EmptyState
          title="Không tìm thấy bệnh án"
          description={error || "Bệnh án không tồn tại hoặc bạn không có quyền xem."}
          action={
            <Button tone="primary" onClick={() => navigate(-1)}>
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  const isDraft = record.status === "DRAFT";
  const isOpen = record.status === "OPEN";
  const isClosed = record.status === "CLOSED";

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <div className={styles.titleRow}>
              <h1 className={styles.horseTitle}>Bệnh án {record.recordNumber}</h1>
              <Badge
                tone={isOpen ? "info" : isClosed ? "ok" : "neutral"}
                dot
              >
                {isOpen ? "Đang điều trị" : isClosed ? "Đã kết thúc" : "Bản nháp"}
              </Badge>
              {record.severity && (
                <Badge
                  tone={
                    record.severity === "CRITICAL" || record.severity === "SEVERE"
                      ? "danger"
                      : record.severity === "MODERATE"
                      ? "warn"
                      : "ok"
                  }
                >
                  Mức độ: {record.severity}
                </Badge>
              )}
            </div>

            <div className={styles.horseMeta}>
              <span className={styles.metaItem}>
                <Icon name="horse" size={14} /> Chiến mã:{" "}
                <Link to={`/medical/horses/${record.horseId}`} style={{ color: "var(--brand)", fontWeight: 600 }}>
                  {record.horseName || record.horseId}
                </Link>
              </span>
              <span className={styles.metaItem}>
                <Icon name="calendar" size={14} /> Ngày khám:{" "}
                <strong>{new Date(record.examinationDate).toLocaleDateString("vi-VN")}</strong>
              </span>
              <span className={styles.metaItem}>
                <Icon name="user" size={14} /> Bác sĩ phụ trách: <strong>{record.vetName || "Dr. Sarah Connor"}</strong>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className={styles.actions}>
            {isVet && isDraft && (
              <>
                <Button tone="ghost" icon="edit" onClick={() => navigate(`/medical/records/${record.id}/edit`)}>
                  Sửa bệnh án
                </Button>
                <Button tone="danger" icon="trash" onClick={() => void handleDeleteDraft()}>
                  Xóa bản nháp
                </Button>
                <Button tone="primary" icon="checkCircle" onClick={() => setShowFinalizeModal(true)}>
                  Chốt bệnh án
                </Button>
              </>
            )}

            {isVet && isOpen && (
              <>
                <Button tone="primary" icon="checkCircle" onClick={() => setShowCloseModal(true)}>
                  Kết thúc điều trị
                </Button>
              </>
            )}

            {isVet && isClosed && (
              <Button tone="ghost" icon="refresh" onClick={() => setShowCloseModal(true)}>
                Mở lại bệnh án
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        items={isOwner ? RECORD_TABS.filter((t) => t.id !== "prescriptions") : RECORD_TABS}
        active={activeTab}
        onChange={(tabId) => setSearchParams({ tab: tabId })}
      />

      {/* Tab 1: Khám & Chẩn đoán */}
      {activeTab === "diagnosis" && (
        <div className={styles.tabContent}>
          {/* Thông tin khám */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <Icon name="clipboard" size={18} />
              Thông tin khám lâm sàng
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, fontSize: "14px" }}>
              <div>
                <span style={{ color: "var(--muted)" }}>Loại khám:</span> <strong>{record.examinationType}</strong>
              </div>
              <div>
                <span style={{ color: "var(--muted)" }}>Nguồn phát hiện:</span>{" "}
                <strong>{record.discoverySource || "VET tự phát hiện"}</strong>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "var(--muted)" }}>Lý do khám:</span>{" "}
                <div style={{ marginTop: 4, padding: "8px 12px", background: "var(--surface-2)", borderRadius: "6px" }}>
                  {record.examinationReason}
                </div>
              </div>
              {record.symptoms && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ color: "var(--muted)" }}>Triệu chứng lâm sàng:</span>{" "}
                  <div style={{ marginTop: 4, padding: "8px 12px", background: "var(--surface-2)", borderRadius: "6px" }}>
                    {record.symptoms}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chỉ số sinh tồn */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <Icon name="pulse" size={18} />
              Chỉ số sinh tồn lúc khám
            </h2>
            <VitalsDisplay vitals={record.vitals} />
          </div>

          {/* Cận lâm sàng */}
          {record.labTests && record.labTests.length > 0 && (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <Icon name="file" size={18} />
                Kết quả cận lâm sàng (Xét nghiệm / Chẩn đoán hình ảnh)
              </h2>
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Loại xét nghiệm</th>
                      <th>Ngày thực hiện</th>
                      <th>Kết quả</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.labTests.map((t, idx) => (
                      <tr key={idx}>
                        <td><strong>{t.testType}</strong></td>
                        <td>{new Date(t.testDate).toLocaleDateString("vi-VN")}</td>
                        <td>{t.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Chẩn đoán & Kết luận */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <Icon name="stethoscope" size={18} />
              Chẩn đoán xác định & Tiên lượng
            </h2>
            <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "6px", fontSize: "15px" }}>
                <strong>Chẩn đoán:</strong> {record.diagnosis || "Chưa có chẩn đoán chi tiết"}
              </div>

              {record.conclusion && (
                <div style={{ padding: "12px", background: "var(--ok-bg)", border: "1px solid var(--ok)", borderRadius: "6px" }}>
                  <strong style={{ color: "var(--ok)" }}>Kết luận đợt điều trị:</strong> {record.conclusion}
                  {record.treatmentResult && (
                    <div style={{ marginTop: 6 }}>
                      Kết quả: <strong>{record.treatmentResult}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Phác đồ điều trị */}
      {activeTab === "phases" && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className={styles.sectionTitle}>
                <Icon name="activity" size={18} />
                Các giai đoạn điều trị (Treatment Phases)
              </h2>
              {isVet && isOpen && (
                <Button size="sm" tone="primary" icon="plus" onClick={() => setShowPhaseModal(true)}>
                  Thêm giai đoạn
                </Button>
              )}
            </div>

            {!record.treatmentPhases || record.treatmentPhases.length === 0 ? (
              <EmptyState
                title="Chưa thiết lập phác đồ"
                description="Bệnh án này chưa có giai đoạn điều trị nào được lập."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {record.treatmentPhases.map((phase, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "16px",
                      background: "var(--surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{phase.phaseName}</strong>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                        {new Date(phase.startDate).toLocaleDateString("vi-VN")} —{" "}
                        {new Date(phase.endDate).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    <div style={{ fontSize: "13px" }}>
                      Mức vận động: <Badge tone="brand">{phase.allowedActivity}</Badge> · Mục tiêu: {phase.target}
                    </div>

                    {phase.careInstructions.length > 0 && (
                      <div style={{ fontSize: "13px", marginTop: 4 }}>
                        <span style={{ color: "var(--muted)" }}>Chỉ đạo chăm sóc:</span>
                        <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                          {phase.careInstructions.map((c, i) => (
                            <li key={i}>
                              <strong>{c.activity}</strong> ({c.frequency})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Đơn thuốc */}
      {activeTab === "prescriptions" && !isOwner && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className={styles.sectionTitle}>
                <Icon name="pill" size={18} />
                Đơn thuốc & Lịch trình dùng thuốc
              </h2>
              {isVet && isOpen && (
                <Button size="sm" tone="primary" icon="plus" onClick={() => setShowPrescriptionModal(true)}>
                  Kê đơn thuốc mới
                </Button>
              )}
            </div>

            {!record.prescriptions || record.prescriptions.length === 0 ? (
              <EmptyState title="Chưa kê đơn thuốc" description="Bệnh án này chưa có đơn thuốc nào." />
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Tên thuốc</th>
                      <th>Liều dùng</th>
                      <th>Đường dùng</th>
                      <th>Tần suất</th>
                      <th>Thời gian</th>
                      <th>Tổng lượng</th>
                      <th>Ngưng thuốc trước thi đấu</th>
                      <th>Trạng thái</th>
                      {isVet && <th>Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {record.prescriptions.map((rx) => (
                      <tr key={rx.id}>
                        <td><strong>{rx.medicationName}</strong></td>
                        <td>{rx.dosage} {rx.unit}</td>
                        <td>{rx.route}</td>
                        <td>{rx.frequencyPerDay} lần/ngày</td>
                        <td>{rx.daysCount} ngày</td>
                        <td>{rx.dosage * rx.frequencyPerDay * rx.daysCount} {rx.unit}</td>
                        <td>
                          {rx.withdrawalDays ? `${rx.withdrawalDays} ngày` : "—"}
                        </td>
                        <td>
                          <Badge tone={rx.status === "ACTIVE" ? "info" : rx.status === "COMPLETED" ? "ok" : "neutral"} dot>
                            {rx.status === "ACTIVE" ? "Đang dùng" : rx.status === "COMPLETED" ? "Đã hoàn tất" : "Đã dừng"}
                          </Badge>
                        </td>
                        {isVet && (
                          <td>
                            {rx.status === "ACTIVE" && (
                              <Button
                                size="sm"
                                tone="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStoppingPrescription(rx);
                                }}
                              >
                                Dừng thuốc
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Tái khám */}
      {activeTab === "followups" && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className={styles.sectionTitle}>
                <Icon name="clock" size={18} />
                Lịch sử các lần tái khám
              </h2>
              {isVet && isOpen && (
                <Button size="sm" tone="primary" icon="plus" onClick={() => setShowFollowUpModal(true)}>
                  Thêm lần tái khám
                </Button>
              )}
            </div>

            {!record.followUps || record.followUps.length === 0 ? (
              <EmptyState title="Chưa có lần tái khám nào" description="Ghi nhận các lần tái khám để theo dõi sự phục hồi." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {record.followUps.map((fu, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "14px 16px",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      background: "var(--surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>Lần tái khám #{idx + 1}</span>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                        {new Date(fu.followUpDate).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    <div style={{ fontSize: "13px", color: "var(--text-2)" }}>
                      Nhiệt độ: <strong>{fu.temperature}°C</strong> · Nhịp tim: <strong>{fu.restingHeartRate} bpm</strong> · Nhịp thở: <strong>{fu.respiratoryRate} lần/phút</strong>
                    </div>

                    <div style={{ fontSize: "13px" }}>
                      <strong>Diễn biến lâm sàng:</strong> {fu.progressNotes}
                    </div>

                    {fu.adjustments && (
                      <div style={{ fontSize: "13px", color: "var(--brand)" }}>
                        <strong>Điều chỉnh:</strong> {fu.adjustments}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showFinalizeModal && (
        <FinalizeRecordModal
          recordNumber={record.recordNumber}
          proposedStatus={record.proposedStatus}
          initialProposeLock={record.proposeMedicalLock}
          onClose={() => setShowFinalizeModal(false)}
          onFinalize={async (input) => {
            await finalizeRecord(record.id, input);
            toast.show("Bệnh án đã được chốt và chuyển sang Đang điều trị.", "ok");
            await fetchDetail();
          }}
        />
      )}

      {showPhaseModal && (
        <AddTreatmentPhaseModal
          onClose={() => setShowPhaseModal(false)}
          onSubmit={async (input) => {
            await addTreatmentPhase(record.id, input);
            toast.show("Đã thêm giai đoạn điều trị.", "ok");
            await fetchDetail();
          }}
        />
      )}

      {showPrescriptionModal && (
        <AddPrescriptionModal
          onClose={() => setShowPrescriptionModal(false)}
          onSubmit={async (input) => {
            await addPrescription(record.id, input);
            toast.show("Đã kê đơn thuốc thành công.", "ok");
            await fetchDetail();
          }}
        />
      )}

      {stoppingPrescription && (
        <StopPrescriptionModal
          medicationName={stoppingPrescription.medicationName}
          onClose={() => setStoppingPrescription(null)}
          onSubmit={async (input) => {
            await stopPrescription(record.id, stoppingPrescription.id!, input);
            toast.show("Đã dừng thuốc.", "ok");
            await fetchDetail();
          }}
        />
      )}

      {showFollowUpModal && (
        <AddFollowUpModal
          onClose={() => setShowFollowUpModal(false)}
          onSubmit={async (input) => {
            await addFollowUp(record.id, input);
            toast.show("Đã ghi nhận lần tái khám.", "ok");
            await fetchDetail();
          }}
        />
      )}

      {showCloseModal && (
        <CloseRecordModal
          recordNumber={record.recordNumber}
          isClosed={isClosed}
          onClose={() => setShowCloseModal(false)}
          onConfirmClose={async (conclusion, treatmentResult) => {
            await closeRecord(record.id, { conclusion, treatmentResult });
            toast.show("Đã kết thúc đợt điều trị của bệnh án.", "ok");
            await fetchDetail();
          }}
          onConfirmReopen={async (reopenReason) => {
            await reopenRecord(record.id, { reopenReason });
            toast.show("Đã mở lại bệnh án.", "ok");
            await fetchDetail();
          }}
        />
      )}
    </div>
  );
}
