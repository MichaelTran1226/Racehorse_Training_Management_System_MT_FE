import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { HealthBadge } from "@/shared/components/ui/HealthBadge";
import { Icon } from "@/shared/components/ui/Icon";
import { Tabs } from "@/shared/components/ui/Tabs";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { cx } from "@/shared/lib/cx";
import { getHorseMedicalProfile, getHorseObservations } from "../api";
import { TrainingLockModal } from "../components/TrainingLockModal";
import { VitalsDisplay } from "../components/VitalsDisplay";
import type { HorseMedicalProfile, ObservationNote } from "../types";
import styles from "./MedicalRecordPage.module.css";

const TABS = [
  { id: "overview", label: "Tổng quan" },
  { id: "records", label: "Bệnh án" },
  { id: "injuries", label: "Chấn thương" },
  { id: "locks", label: "Khóa huấn luyện" },
  { id: "preventive", label: "Lịch định kỳ" },
  { id: "observations", label: "Ghi chú quan sát" },
];

export default function MedicalRecordPage() {
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState<HorseMedicalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Observation filters
  const [obsUrgency, setObsUrgency] = useState<string>("");
  const [observations, setObservations] = useState<ObservationNote[]>([]);

  // Lock modal states
  const [lockModalMode, setLockModalMode] = useState<"place" | "lift" | "extend" | null>(null);

  const isVet = user?.role === "VETERINARIAN" || user?.role === "CLUB_MANAGER";
  const isOwner = user?.role === "HORSE_OWNER";
  const isGroom = user?.role === "GROOM";

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getHorseMedicalProfile(id);
      setProfile(res);
      setObservations(res.observations || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải hồ sơ y tế của ngựa.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Load observations with filter
  async function handleFilterObservations(urgency: string) {
    setObsUrgency(urgency);
    if (!id) return;
    try {
      const res = await getHorseObservations(id, { urgency: urgency || undefined });
      setObservations(res.observations);
    } catch {
      toast.show("Lỗi khi lọc ghi chú quan sát.", "danger");
    }
  }

  function handleTabChange(tabId: string) {
    setSearchParams({ tab: tabId });
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
          Đang tải hồ sơ y tế...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <EmptyState
          title="Không thể tải hồ sơ y tế"
          description={error || "Không tìm thấy dữ liệu hoặc bạn không có quyền xem hồ sơ con ngựa này."}
          action={
            <Button tone="primary" onClick={() => void loadData()}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  const { horse, overview, records, injuries, locks, preventive } = profile;

  return (
    <div className={styles.container}>
      {/* Header Profile */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <div className={styles.titleRow}>
              <h1 className={styles.horseTitle}>{horse.name}</h1>
              <HealthBadge status={horse.healthStatus} withIcon />
              {horse.isMedicalLocked && (
                <Badge tone="danger" icon="lock">
                  Đang khóa huấn luyện
                </Badge>
              )}
            </div>
            <div className={styles.horseMeta}>
              <span className={styles.metaItem}>
                <Icon name="pin" size={14} /> Mã vi chíp: <strong>{horse.microchipRfid}</strong>
              </span>
              <span className={styles.metaItem}>
                <Icon name="horse" size={14} /> Giống: <strong>{horse.breed}</strong>
              </span>
              <span className={styles.metaItem}>
                <Icon name="grid" size={14} /> Chuồng: <strong>{horse.stallCode || "Chưa xếp ô"}</strong>
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            {isVet && (
              <>
                <Button
                  tone="primary"
                  icon="plus"
                  onClick={() => navigate(`/medical/records/new?horseId=${horse.id}`)}
                >
                  Tạo bệnh án mới
                </Button>

                {!horse.isMedicalLocked ? (
                  <Button tone="danger" icon="lock" onClick={() => setLockModalMode("place")}>
                    Đặt Khóa huấn luyện
                  </Button>
                ) : (
                  <>
                    <Button tone="ghost" icon="clock" onClick={() => setLockModalMode("extend")}>
                      Gia hạn xem xét
                    </Button>
                    <Button tone="primary" icon="unlock" onClick={() => setLockModalMode("lift")}>
                      Gỡ Khóa huấn luyện
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Lock Banner Warning */}
        {horse.isMedicalLocked && horse.activeLock && (
          <div className={styles.lockAlert}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="alert" size={20} />
              <div>
                <strong>LỆNH KHÓA HUẤN LUYỆN ĐANG HIỆU LỰC ({horse.activeLock.lockCode})</strong>
                <div>
                  Lý do: {horse.activeLock.lockReason} · Người đặt: {horse.activeLock.lockedBy} (
                  {new Date(horse.activeLock.lockedAt).toLocaleDateString("vi-VN")})
                </div>
              </div>
            </div>
            <div>
              Ngày xem xét lại: <strong>{new Date(horse.activeLock.reviewDate).toLocaleDateString("vi-VN")}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs items={TABS} active={activeTab} onChange={handleTabChange} />

      {/* Tab 1: Tổng quan */}
      {activeTab === "overview" && (
        <div className={styles.tabContent}>
          <div className={styles.overviewGrid}>
            {/* Tình trạng & Vận động */}
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <Icon name="activity" size={18} />
                Mức vận động & Tình trạng áp dụng
              </h2>
              <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  Mức vận động cho phép:{" "}
                  <Badge tone="brand">
                    {overview.allowedActivity || "Bình thường"}
                  </Badge>
                </div>
                <div>
                  Hướng dẫn chăm sóc đặc biệt:
                  {overview.careInstructions.length === 0 ? (
                    <div style={{ color: "var(--muted)", marginTop: 4 }}>Không có chỉ định đặc biệt.</div>
                  ) : (
                    <ul style={{ margin: "6px 0 0 18px", padding: 0, color: "var(--text-2)" }}>
                      {overview.careInstructions.map((c, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>
                          <strong>{c.activity}</strong> — {c.frequency}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Thuốc đang dùng (Ẩn với Owner & Groom theo FR-3.18) */}
            {!isOwner && !isGroom && (
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>
                  <Icon name="pill" size={18} />
                  Thuốc đang sử dụng
                </h2>
                {overview.activeMedications.length === 0 ? (
                  <div style={{ color: "var(--muted)", fontSize: "13px" }}>Hiện không dùng thuốc nào.</div>
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
                        </tr>
                      </thead>
                      <tbody>
                        {overview.activeMedications.map((m, i) => (
                          <tr key={i}>
                            <td><strong>{m.medicationName}</strong></td>
                            <td>{m.dosage} {m.unit}</td>
                            <td>{m.route}</td>
                            <td>{m.frequencyPerDay} lần/ngày</td>
                            <td>{m.daysCount} ngày</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chỉ số sinh tồn */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <Icon name="pulse" size={18} />
              Chỉ số sinh tồn gần nhất & Lịch sử
            </h2>
            <VitalsDisplay
              vitals={overview.latestVitals}
              history={overview.vitalsHistory}
              recordedAt={overview.latestVitals?.recordedAt}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Bệnh án */}
      {activeTab === "records" && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className={styles.sectionTitle}>
                <Icon name="clipboard" size={18} />
                Lịch sử hồ sơ bệnh án
              </h2>
              {isVet && (
                <Button size="sm" tone="primary" icon="plus" onClick={() => navigate(`/medical/records/new?horseId=${horse.id}`)}>
                  Thêm bệnh án
                </Button>
              )}
            </div>

            {records.length === 0 ? (
              <EmptyState title="Chưa có bệnh án nào" description="Ngựa này hiện chưa ghi nhận hồ sơ bệnh án khám chữa." />
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Mã bệnh án</th>
                      <th>Ngày khám</th>
                      <th>Loại khám</th>
                      <th>Chẩn đoán</th>
                      <th>Mức độ</th>
                      <th>Trạng thái</th>
                      <th>Bác sĩ thú y</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id} onClick={() => navigate(`/medical/records/${r.id}`)}>
                        <td>
                          <strong>{r.recordNumber}</strong>
                        </td>
                        <td>{new Date(r.examinationDate).toLocaleDateString("vi-VN")}</td>
                        <td>{r.examinationType}</td>
                        <td>{r.diagnosis || "Chưa có"}</td>
                        <td>
                          <Badge tone={r.severity === "CRITICAL" || r.severity === "SEVERE" ? "danger" : "ok"}>
                            {r.severity || "—"}
                          </Badge>
                        </td>
                        <td>
                          <Badge tone={r.status === "OPEN" ? "info" : r.status === "CLOSED" ? "ok" : "neutral"} dot>
                            {r.status === "OPEN" ? "Đang điều trị" : r.status === "CLOSED" ? "Đã kết thúc" : "Nháp"}
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
      )}

      {/* Tab 3: Chấn thương */}
      {activeTab === "injuries" && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className={styles.sectionTitle}>
                <Icon name="bone" size={18} />
                Danh sách chấn thương & Vị trí tổn thương
              </h2>
              <Button size="sm" tone="ghost" icon="map" onClick={() => navigate(`/medical/horses/${horse.id}/injuries`)}>
                Mở mô hình 2D
              </Button>
            </div>

            {injuries.length === 0 ? (
              <EmptyState title="Không có chấn thương" description="Ngựa hiện không ghi nhận tổn thương cơ xương khớp nào." />
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Vùng tổn thương</th>
                      <th>Loại tổn thương</th>
                      <th>Mức độ</th>
                      <th>Giai đoạn</th>
                      <th>Ngày phát hiện</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {injuries.map((inj) => (
                      <tr key={inj.id}>
                        <td><strong>{inj.region}</strong> ({inj.view === "LEFT" ? "Bên trái" : "Bên phải"})</td>
                        <td>{inj.injuryType}</td>
                        <td>
                          <Badge tone={inj.severity === "SEVERE" || inj.severity === "CRITICAL" ? "danger" : "warn"}>
                            {inj.severity}
                          </Badge>
                        </td>
                        <td>
                          <Badge tone={inj.stage === "ACUTE" ? "danger" : inj.stage === "HEALED" ? "ok" : "warn"} dot>
                            {inj.stage === "ACUTE" ? "Cấp tính" : inj.stage === "SUBACUTE" ? "Bán cấp" : inj.stage === "RECOVERING" ? "Hồi phục" : "Đã lành"}
                          </Badge>
                        </td>
                        <td>{new Date(inj.detectedDate).toLocaleDateString("vi-VN")}</td>
                        <td>{inj.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Khóa huấn luyện */}
      {activeTab === "locks" && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <Icon name="lock" size={18} />
              Lịch sử Khóa huấn luyện (Training Locks)
            </h2>

            {locks.length === 0 ? (
              <EmptyState title="Chưa từng bị khóa" description="Ngựa này chưa từng nhận lệnh Khóa huấn luyện nào." />
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Mã khóa</th>
                      <th>Trạng thái áp dụng</th>
                      <th>Thời điểm đặt</th>
                      <th>Người đặt</th>
                      <th>Lý do</th>
                      <th>Ngày xem xét</th>
                      <th>Gỡ lúc</th>
                      <th>Lý do gỡ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locks.map((lk) => (
                      <tr key={lk.id}>
                        <td><strong>{lk.lockCode}</strong></td>
                        <td><Badge tone="danger">{lk.appliedMedicalStatus}</Badge></td>
                        <td>{new Date(lk.lockedAt).toLocaleDateString("vi-VN")}</td>
                        <td>{lk.lockedBy}</td>
                        <td>{lk.lockReason}</td>
                        <td>{new Date(lk.reviewDate).toLocaleDateString("vi-VN")}</td>
                        <td>{lk.releasedAt ? new Date(lk.releasedAt).toLocaleDateString("vi-VN") : "Đang hiệu lực"}</td>
                        <td>{lk.releaseReason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Lịch định kỳ */}
      {activeTab === "preventive" && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <Icon name="calendar" size={18} />
              Lịch tiêm phòng, tẩy giun & kiểm tra móng
            </h2>

            {preventive.length === 0 ? (
              <EmptyState title="Chưa có lịch định kỳ" description="Chưa thiết lập danh mục chăm sóc định kỳ cho ngựa này." />
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Hạng mục</th>
                      <th>Nhóm</th>
                      <th>Lần gần nhất</th>
                      <th>Người thực hiện</th>
                      <th>Ngày đến hạn</th>
                      <th>Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preventive.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.type}</strong></td>
                        <td>{p.category}</td>
                        <td>{p.lastAdministeredDate ? new Date(p.lastAdministeredDate).toLocaleDateString("vi-VN") : "—"}</td>
                        <td>{p.administeredBy || "—"}</td>
                        <td>{new Date(p.dueDate).toLocaleDateString("vi-VN")}</td>
                        <td>
                          <Badge tone={p.status === "OVERDUE" ? "danger" : p.status === "DUE_SOON" ? "warn" : "ok"} dot>
                            {p.status === "OVERDUE" ? "Quá hạn" : p.status === "DUE_SOON" ? "Sắp đến hạn" : "Còn hạn"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Ghi chú quan sát */}
      {activeTab === "observations" && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <h2 className={styles.sectionTitle}>
                <Icon name="eye" size={18} />
                Nhật ký quan sát sức khỏe của Groom
              </h2>

              <div className={styles.filtersRow}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>Mức độ:</span>
                <Button
                  size="sm"
                  tone={obsUrgency === "" ? "primary" : "ghost"}
                  onClick={() => void handleFilterObservations("")}
                >
                  Tất cả
                </Button>
                <Button
                  size="sm"
                  tone={obsUrgency === "NORMAL" ? "primary" : "ghost"}
                  onClick={() => void handleFilterObservations("NORMAL")}
                >
                  Bình thường
                </Button>
                <Button
                  size="sm"
                  tone={obsUrgency === "ATTENTION" ? "primary" : "ghost"}
                  onClick={() => void handleFilterObservations("ATTENTION")}
                >
                  Cần chú ý
                </Button>
                <Button
                  size="sm"
                  tone={obsUrgency === "URGENT" ? "danger" : "ghost"}
                  onClick={() => void handleFilterObservations("URGENT")}
                >
                  Khẩn cấp
                </Button>
              </div>
            </div>

            {observations.length === 0 ? (
              <EmptyState title="Không có ghi chú nào" description="Chưa có nhật ký quan sát nào từ nhân viên chăm sóc." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {observations.map((o) => (
                  <div key={o.id} className={cx(styles.observationItem, o.urgency === "URGENT" && styles.urgent)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <strong>{o.groomName}</strong>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>({o.shift})</span>
                        <Badge tone={o.urgency === "URGENT" ? "danger" : o.urgency === "ATTENTION" ? "warn" : "neutral"} dot>
                          {o.urgency === "URGENT" ? "Khẩn cấp" : o.urgency === "ATTENTION" ? "Cần chú ý" : "Bình thường"}
                        </Badge>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                        {new Date(o.observedAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text)" }}>{o.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lock Action Modals */}
      {lockModalMode && (
        <TrainingLockModal
          mode={lockModalMode}
          horseName={horse.name}
          currentReviewDate={horse.activeLock?.reviewDate}
          onClose={() => setLockModalMode(null)}
          onPlaceLock={async () => {
            toast.show("Đã kích hoạt Khóa huấn luyện.", "ok");
            await loadData();
          }}
          onLiftLock={async () => {
            toast.show("Đã gỡ Khóa huấn luyện.", "ok");
            await loadData();
          }}
          onExtendLock={async () => {
            toast.show("Đã gia hạn ngày xem xét khóa.", "ok");
            await loadData();
          }}
        />
      )}
    </div>
  );
}
