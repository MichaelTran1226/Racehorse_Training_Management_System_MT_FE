import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { Card } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Alert } from "@/shared/components/ui/Alert";
import { Tabs } from "@/shared/components/ui/Tabs";
import { HEALTH_STATUS } from "@/shared/lib/status";
import type { HealthStatus } from "@/shared/types/enums";
import { getHorseById } from "../api";
import type { Horse } from "../types";

export default function HorseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useCurrentUser();
  const [horse, setHorse] = useState<Horse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    if (!id) return;
    let active = true;
    getHorseById(id)
      .then((data) => {
        if (active) setHorse(data);
      })
      .catch((err) => {
        if (active) setError(err.message || "Không tìm thấy hồ sơ ngựa hoặc bạn không có quyền xem.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <PageHeader eyebrow="HỒ SƠ ĐỊNH DANH NGỰA" title="Chi tiết hồ sơ ngựa" />
        <Card pad={32}>
          <p style={{ color: "var(--ink-muted, #64748b)" }}>Đang tải thông tin chi tiết ngựa...</p>
        </Card>
      </div>
    );
  }

  if (error || !horse) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <PageHeader eyebrow="HỒ SƠ ĐỊNH DANH NGỰA" title="Không Tìm Thấy Hồ Sơ" />
        <Card pad={24}>
          <Alert tone="danger" title="Không tìm thấy hồ sơ ngựa">
            {error || "Hồ sơ ngựa không tồn tại hoặc tài khoản của bạn không có quyền truy cập."}
          </Alert>
          <div style={{ marginTop: "1rem" }}>
            <Link to="/horses">
              <Button tone="secondary">Về danh sách ngựa</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isOwner = currentUser.role === "HORSE_OWNER";
  const isGroom = currentUser.role === "GROOM";
  const isManager = currentUser.role === "CLUB_MANAGER";

  // Tính tuổi
  let ageText = "—";
  if (horse.dob) {
    const birthYear = new Date(horse.dob).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    ageText = `${age >= 0 ? age : 0} tuổi`;
  }

  // Microchip hiển thị
  let displayMicrochip = horse.microchip || horse.microchipRfid || "—";
  if (isGroom && displayMicrochip !== "—" && displayMicrochip.length > 4) {
    displayMicrochip = "*".repeat(displayMicrochip.length - 4) + displayMicrochip.slice(-4);
  }

  const statusCfg = HEALTH_STATUS[horse.status as HealthStatus] || { label: horse.status, tone: "neutral" };

  // Danh sách các Tab theo SC-1.03 (Ẩn Tab Chuồng và Lịch sử ô chuồng với Owner)
  const tabs = [
    { id: "info", label: "1. Thông tin chung" },
    ...(!isOwner ? [{ id: "stable", label: "2. Chuồng & Chăm sóc" }] : [{ id: "routine", label: "2. Lịch sinh hoạt" }]),
    { id: "owner", label: "3. Chủ sở hữu" },
    { id: "status-history", label: "4. Lịch sử trạng thái" },
    ...(!isOwner ? [{ id: "stall-history", label: "5. Lịch sử ô chuồng" }] : []),
    { id: "timeline", label: "6. Dòng thời gian" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PageHeader
        eyebrow={`MÃ NGỰA: ${horse.horseCode || horse.id}`}
        title={horse.name}
        description={`${horse.breed} · ${horse.gender} · ${horse.color} · ${ageText}`}
        action={
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/horses">
              <Button tone="secondary">← Danh sách</Button>
            </Link>

            {isManager && horse.status !== "RETIRED" && (
              <Link to={`/horses/${horse.id}/edit`}>
                <Button tone="secondary">Sửa hồ sơ</Button>
              </Link>
            )}

            <Link to={`/medical/horses/${horse.id}`}>
              <Button tone="secondary">Bệnh án y tế</Button>
            </Link>

            <Link to={`/medical/horses/${horse.id}/injuries`}>
              <Button tone="secondary">Sơ đồ 2D</Button>
            </Link>
          </div>
        }
      />

      {/* Banner Khóa huấn luyện (khi đang khóa) */}
      {horse.isMedicalLocked && (
        <Alert
          tone="danger"
          title="LỆNH KHÓA HUẤN LUYỆN Y TẾ ĐANG CÓ HIỆU LỰC"
        >
          Ngựa đang chịu Khóa huấn luyện y tế. Không thể xếp lịch tập nặng hoặc tham gia thi đấu
          cho đến khi Bác sĩ thú y chính thức dỡ bỏ khóa.
          {horse.medicalLocks && horse.medicalLocks[0] && (
            <div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
              <strong>Lý do khóa:</strong> {horse.medicalLocks[0].lockReason} (Khóa lúc:{" "}
              {new Date(horse.medicalLocks[0].lockedAt).toLocaleString("vi-VN")})
            </div>
          )}
        </Alert>
      )}

      {/* Banner Ngừng quản lý */}
      {horse.status === "RETIRED" && (
        <Alert tone="info" title="Hồ sơ đã ngừng quản lý">
          Cá thể ngựa này hiện đã được đưa vào diện Ngừng quản lý (bán, giải nghệ hoặc qua đời).
          Dữ liệu lịch sử vẫn được lưu trữ nguyên vẹn để phục vụ tra cứu.
        </Alert>
      )}

      <Card pad={20}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "var(--brand-surface, #f0fdf4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.75rem",
                border: "2px solid var(--border, #e2e8f0)",
              }}
            >
              🐎
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                {horse.name}
              </h2>
              <span style={{ fontSize: "0.875rem", color: "var(--ink-muted, #64748b)" }}>
                {horse.horseCode || horse.id} · {horse.breed}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
            {horse.isMedicalLocked && <Badge tone="danger">Khóa huấn luyện</Badge>}
          </div>
        </div>
      </Card>

      {/* 6 Tabs điều hướng nội dung */}
      <Tabs
        items={tabs}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Nội dung từng Tab */}
      {activeTab === "info" && (
        <Card pad={24}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.125rem", fontWeight: 700 }}>
            Thông Tin Định Danh & Lý Lịch
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
              fontSize: "0.875rem",
            }}
          >
            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Mã ngựa (Horse ID)</div>
              <div style={{ fontWeight: 600 }}>{horse.horseCode || horse.id}</div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Tên ngựa</div>
              <div style={{ fontWeight: 600 }}>{horse.name}</div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Số microchip</div>
              <div style={{ fontWeight: 600, fontFamily: "monospace" }}>{displayMicrochip}</div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Mã thẻ RFID</div>
              <div style={{ fontWeight: 600, fontFamily: "monospace" }}>{horse.rfid || "—"}</div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Giống ngựa</div>
              <div style={{ fontWeight: 600 }}>{horse.breed}</div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Ngày sinh / Tuổi</div>
              <div style={{ fontWeight: 600 }}>
                {horse.dob ? new Date(horse.dob).toLocaleDateString("vi-VN") : "—"} ({ageText})
              </div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Giới tính</div>
              <div style={{ fontWeight: 600 }}>{horse.gender}</div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Màu lông</div>
              <div style={{ fontWeight: 600 }}>{horse.color}</div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Trạng thái vận hành & y tế</div>
              <div>
                <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
              </div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Ngày tạo hồ sơ</div>
              <div style={{ fontWeight: 600 }}>
                {horse.createdAt ? new Date(horse.createdAt).toLocaleString("vi-VN") : "—"}
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === "stable" && !isOwner && (
        <Card pad={24}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.125rem", fontWeight: 700 }}>
            Phân Bổ Chuồng Trại & Nhân Sự Chăm Sóc
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ border: "1px solid var(--border, #e2e8f0)", borderRadius: 8, padding: 16 }}>
              <h4 style={{ margin: "0 0 0.75rem 0" }}>Ô chuồng hiện tại</h4>
              <p style={{ margin: "0 0 0.5rem 0" }}>
                <strong>Mã ô chuồng:</strong> {horse.stallCode || "Chưa phân bổ ô chuồng"}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Khu vực:</strong> {horse.zone || "Chưa phân bổ khu chuồng"}
              </p>
            </div>

            <div style={{ border: "1px solid var(--border, #e2e8f0)", borderRadius: 8, padding: 16 }}>
              <h4 style={{ margin: "0 0 0.75rem 0" }}>Nhân viên chăm sóc phụ trách</h4>
              <p style={{ margin: 0 }}>
                <strong>Người phụ trách chính:</strong> {horse.primaryGroom || "Chưa phân công groom"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {(activeTab === "routine" || (activeTab === "stable" && isOwner)) && (
        <Card pad={24}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.125rem", fontWeight: 700 }}>
            Lịch Sinh Hoạt Hằng Ngày
          </h3>
          <p style={{ color: "var(--ink-muted, #64748b)" }}>
            Lịch sinh hoạt tiêu chuẩn: Cho ăn (06:00, 11:30, 17:00), Vệ sinh chuồng (07:00), Tập luyện thể lực (08:00 - 10:00), Tắm & ngâm chân nước đá (10:30).
          </p>
        </Card>
      )}

      {activeTab === "owner" && (
        <Card pad={24}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.125rem", fontWeight: 700 }}>
            Thông Tin Chủ Sở Hữu (Ownership)
          </h3>
          {horse.owner ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <strong>Họ tên chủ ngựa:</strong> {horse.owner.fullName}
              </div>
              <div>
                <strong>Email liên hệ:</strong> {horse.owner.email}
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--ink-muted, #64748b)" }}>
              {horse.ownerName ? `Chủ sở hữu: ${horse.ownerName}` : "Chưa có thông tin chủ sở hữu được liên kết."}
            </p>
          )}
        </Card>
      )}

      {activeTab === "status-history" && (
        <Card pad={24}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.125rem", fontWeight: 700 }}>
            Lịch Sử Chuyển Đổi Trạng Thái
          </h3>
          <p style={{ color: "var(--ink-muted, #64748b)" }}>
            Trạng thái hiện tại: <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge> (Cập nhật lúc:{" "}
            {horse.updatedAt ? new Date(horse.updatedAt).toLocaleString("vi-VN") : "—"})
          </p>
        </Card>
      )}

      {activeTab === "stall-history" && !isOwner && (
        <Card pad={24}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.125rem", fontWeight: 700 }}>
            Lịch Sử Ô Chuồng
          </h3>
          <p style={{ color: "var(--ink-muted, #64748b)" }}>
            Ô chuồng đang ở: <strong>{horse.stallCode || "Chưa có"}</strong> ({horse.zone || "Chưa gán khu"})
          </p>
        </Card>
      )}

      {activeTab === "timeline" && (
        <Card pad={24}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.125rem", fontWeight: 700 }}>
            Dòng Thời Gian Toàn Vòng Đời Ngựa
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                📋
              </div>
              <div>
                <strong>Hồ sơ khởi tạo thành công</strong>
                <div style={{ fontSize: "0.8125rem", color: "var(--ink-muted, #64748b)" }}>
                  {horse.createdAt ? new Date(horse.createdAt).toLocaleString("vi-VN") : "Hệ thống"} · Mã định danh {horse.horseCode || horse.id}
                </div>
              </div>
            </div>
            {horse.isMedicalLocked && (
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  🔒
                </div>
                <div>
                  <strong>Áp dụng Khóa huấn luyện y tế</strong>
                  <div style={{ fontSize: "0.8125rem", color: "var(--ink-muted, #64748b)" }}>
                    Đình chỉ mọi hoạt động tập nặng và thi đấu
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
