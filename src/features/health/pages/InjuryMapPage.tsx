import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { cx } from "@/shared/lib/cx";
import { HorseAnatomyGraphic } from "../components/HorseAnatomyGraphic";
import type { InjuryItem, InjuryStage, SeverityLevel } from "../types";
import styles from "./InjuryMapPage.module.css";

const STAGE_COLORS: Record<InjuryStage, string> = {
  ACUTE: "var(--danger)",
  SUBACUTE: "var(--warn)",
  RECOVERING: "#b89428",
  HEALED: "var(--ok)",
};

const STAGE_LABELS: Record<InjuryStage, string> = {
  ACUTE: "Cấp tính",
  SUBACUTE: "Bán cấp",
  RECOVERING: "Hồi phục",
  HEALED: "Đã lành",
};

const REGION_OPTIONS = [
  { value: "Đầu", label: "Đầu (Head)" },
  { value: "Cổ", label: "Cổ (Neck)" },
  { value: "Vai", label: "Vai (Shoulder)" },
  { value: "Vai u (Withers)", label: "Vai u (Withers)" },
  { value: "Lưng", label: "Lưng (Back)" },
  { value: "Thắt lưng", label: "Thắt lưng (Loin)" },
  { value: "Mông / Hông", label: "Mông / Hông (Croup / Hip)" },
  { value: "Ngực", label: "Ngực (Chest)" },
  { value: "Bụng", label: "Bụng (Abdomen)" },
  { value: "Khớp gối trước (Knee)", label: "Khớp gối trước (Knee)" },
  { value: "Gân gấp chi trước (SDFT)", label: "Gân gấp chi trước (SDFT)" },
  { value: "Khớp cổ chân (Fetlock)", label: "Khớp cổ chân (Fetlock)" },
  { value: "Cổ móng (Pastern)", label: "Cổ móng (Pastern)" },
  { value: "Móng chân (Hoof)", label: "Móng chân (Hoof)" },
  { value: "Khớp khuỷu sau (Hock)", label: "Khớp khuỷu sau (Hock)" },
];

const SEVERITY_OPTIONS = [
  { value: "MILD", label: "Nhẹ (Độ 1)" },
  { value: "MODERATE", label: "Trung bình (Độ 2)" },
  { value: "SEVERE", label: "Nặng (Độ 3)" },
  { value: "CRITICAL", label: "Rất nặng / Nguy kịch (Độ 4)" },
];

interface PointInjury extends InjuryItem {
  x: number; // Tọa độ % trên canvas
  y: number;
}

const INITIAL_INJURIES: PointInjury[] = [
  {
    id: "inj-1",
    horseId: "horse-2",
    region: "Gân gấp chi trước (SDFT)",
    view: "LEFT",
    layer: "MUSCLE",
    injuryType: "Viêm gân gấp nông (Desmitis)",
    severity: "MODERATE",
    stage: "ACUTE",
    detectedDate: "2026-09-28",
    x: 37,
    y: 75,
    notes: "Tổn thương vi sợi độ 1, ấn đau phản xạ rõ rệt",
  },
  {
    id: "inj-2",
    horseId: "horse-2",
    region: "Vai",
    view: "LEFT",
    layer: "MUSCLE",
    injuryType: "Căng cứng cơ bả vai",
    severity: "MILD",
    stage: "RECOVERING",
    detectedDate: "2026-09-20",
    x: 38,
    y: 34,
    notes: "Đang massage vật lý trị liệu, phản xạ vận động đã cải thiện tốt",
  },
];

export default function InjuryMapPage() {
  const { id = "horse-2" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const isVet = user?.role === "VETERINARIAN" || user?.role === "CLUB_MANAGER";

  const [view, setView] = useState<"LEFT" | "RIGHT">("LEFT");
  const [layer, setLayer] = useState<"MUSCLE" | "SKELETON">("MUSCLE");
  const [markingMode, setMarkingMode] = useState(false);
  const [showHealed, setShowHealed] = useState(false);

  const [injuries, setInjuries] = useState<PointInjury[]>(INITIAL_INJURIES);
  const [selectedId, setSelectedId] = useState<string | null>("inj-1");

  // Dialogs
  const [addModalPoint, setAddModalPoint] = useState<{ x: number; y: number } | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);

  // Form add
  const [formRegion, setFormRegion] = useState("Gân gấp chi trước (SDFT)");
  const [formType, setFormType] = useState("");
  const [formSeverity, setFormSeverity] = useState<SeverityLevel>("MODERATE");
  const [formNotes, setFormNotes] = useState("");

  // Form update stage
  const [newStage, setNewStage] = useState<InjuryStage>("SUBACUTE");
  const [stageNotes, setStageNotes] = useState("");

  const visibleInjuries = injuries.filter((inj) => {
    if (inj.view !== view) return false;
    if (!showHealed && inj.stage === "HEALED") return false;
    return true;
  });

  const selectedInjury = injuries.find((i) => i.id === selectedId);

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!markingMode || !isVet) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    setAddModalPoint({ x, y });
    setMarkingMode(false);
  }

  function handleSaveNewInjury() {
    if (!addModalPoint || !formType.trim()) return;
    const newInj: PointInjury = {
      id: `inj-${Date.now()}`,
      horseId: id,
      region: formRegion,
      view,
      layer,
      injuryType: formType.trim(),
      severity: formSeverity,
      stage: "ACUTE",
      detectedDate: new Date().toISOString().split("T")[0],
      x: addModalPoint.x,
      y: addModalPoint.y,
      notes: formNotes.trim() || undefined,
    };
    setInjuries([...injuries, newInj]);
    setSelectedId(newInj.id);
    setAddModalPoint(null);
    setFormType("");
    setFormNotes("");
    toast.show("Đã đánh dấu điểm chấn thương mới thành công.", "ok");
  }

  function handleUpdateStage() {
    if (!selectedInjury) return;
    const updated = injuries.map((inj) => {
      if (inj.id === selectedInjury.id) {
        return {
          ...inj,
          stage: newStage,
          updatedDate: new Date().toISOString().split("T")[0],
          notes: stageNotes.trim() ? `${inj.notes || ""}\n- [${new Date().toLocaleDateString("vi-VN")}]: ${stageNotes.trim()}` : inj.notes,
        };
      }
      return inj;
    });
    setInjuries(updated);
    setShowStageModal(false);
    setStageNotes("");
    toast.show(`Đã cập nhật tiến trình hồi phục thành: ${STAGE_LABELS[newStage]}.`, "ok");
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button tone="ghost" icon="arrowLeft" onClick={() => navigate(`/medical/horses/${id}`)}>
            Hồ sơ y tế
          </Button>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "var(--ink)" }}>
              Mô hình Chấn thương 2D & Tiến trình hồi phục (SC-3.05)
            </h1>
            <span style={{ fontSize: "13px", color: "var(--muted)" }}>
              Đánh dấu vị trí tổn thương giải phẫu và theo dõi sự chuyển biến qua các giai đoạn lâm sàng.
            </span>
          </div>
        </div>

        {isVet && (
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              tone={markingMode ? "danger" : "primary"}
              icon="pin"
              onClick={() => setMarkingMode(!markingMode)}
            >
              {markingMode ? "Đang bật chế độ đánh dấu (Click lên hình)" : "Bật chế độ đánh dấu"}
            </Button>
          </div>
        )}
      </div>

      <div className={styles.mainLayout}>
        {/* Model 2D Canvas */}
        <div className={styles.modelCard}>
          <div className={styles.toolbar}>
            <div className={styles.toggleGroup}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted)" }}>Góc nhìn:</span>
              <Button
                size="sm"
                tone={view === "LEFT" ? "primary" : "ghost"}
                onClick={() => setView("LEFT")}
              >
                Bên trái
              </Button>
              <Button
                size="sm"
                tone={view === "RIGHT" ? "primary" : "ghost"}
                onClick={() => setView("RIGHT")}
              >
                Bên phải
              </Button>
            </div>

            <div className={styles.toggleGroup}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted)" }}>Lớp giải phẫu:</span>
              <Button
                size="sm"
                tone={layer === "MUSCLE" ? "primary" : "ghost"}
                onClick={() => setLayer("MUSCLE")}
              >
                Lớp Cơ
              </Button>
              <Button
                size="sm"
                tone={layer === "SKELETON" ? "primary" : "ghost"}
                onClick={() => setLayer("SKELETON")}
              >
                Lớp Xương
              </Button>
            </div>

            <Checkbox
              label="Hiện chấn thương đã lành"
              checked={showHealed}
              onChange={setShowHealed}
            />
          </div>

          {/* Canvas SVG Area */}
          <div
            className={cx(styles.canvasArea, markingMode && styles.marking)}
          >
            <div
              className={styles.stageWrapper}
              onClick={handleCanvasClick}
            >
              {/* SVG Horse Anatomy Graphic */}
              <HorseAnatomyGraphic view={view} layer={layer} />

              {/* Render Pins */}
              {visibleInjuries.map((inj, idx) => (
                <div
                  key={inj.id}
                  className={cx(styles.pin, inj.id === selectedId && styles.selected)}
                  style={{
                    left: `${inj.x}%`,
                    top: `${inj.y}%`,
                    backgroundColor: STAGE_COLORS[inj.stage],
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(inj.id);
                  }}
                  title={`${inj.region}: ${inj.injuryType} (${STAGE_LABELS[inj.stage]})`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", fontSize: "12px" }}>
            <span style={{ fontWeight: 600 }}>Chú giải giai đoạn:</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS.ACUTE }} />
              Cấp tính
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS.SUBACUTE }} />
              Bán cấp
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS.RECOVERING }} />
              Hồi phục
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS.HEALED }} />
              Đã lành
            </span>
          </div>
        </div>

        {/* Side Panel */}
        <div className={styles.sidePanel}>
          {/* List of points */}
          <div className={styles.panelCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "15px" }}>Điểm chấn thương ({visibleInjuries.length})</strong>
            </div>

            {visibleInjuries.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: "13px" }}>Chưa có điểm chấn thương nào trên góc nhìn này.</div>
            ) : (
              <div className={styles.injuryList}>
                {visibleInjuries.map((inj, idx) => (
                  <div
                    key={inj.id}
                    className={cx(styles.injuryItem, inj.id === selectedId && styles.active)}
                    onClick={() => setSelectedId(inj.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>
                        #{idx + 1} {inj.region}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--muted)" }}>{inj.injuryType}</div>
                    </div>
                    <Badge tone={inj.stage === "ACUTE" ? "danger" : inj.stage === "HEALED" ? "ok" : "warn"} dot>
                      {STAGE_LABELS[inj.stage]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details of selected point */}
          {selectedInjury && (
            <div className={styles.panelCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "15px" }}>Chi tiết tổn thương</strong>
                {isVet && selectedInjury.stage !== "HEALED" && (
                  <Button size="sm" tone="primary" onClick={() => setShowStageModal(true)}>
                    Cập nhật hồi phục
                  </Button>
                )}
              </div>

              <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div>Vùng: <strong>{selectedInjury.region}</strong> ({selectedInjury.view === "LEFT" ? "Bên trái" : "Bên phải"})</div>
                <div>Loại: <strong>{selectedInjury.injuryType}</strong></div>
                <div>
                  Mức độ: <Badge tone={selectedInjury.severity === "CRITICAL" ? "danger" : "warn"}>{selectedInjury.severity}</Badge>
                </div>
                <div>
                  Giai đoạn: <Badge tone={selectedInjury.stage === "ACUTE" ? "danger" : "ok"} dot>{STAGE_LABELS[selectedInjury.stage]}</Badge>
                </div>
                <div>Ngày phát hiện: <strong>{new Date(selectedInjury.detectedDate).toLocaleDateString("vi-VN")}</strong></div>

                {selectedInjury.notes && (
                  <div style={{ background: "var(--surface-2)", padding: "8px 10px", borderRadius: "6px", marginTop: 4 }}>
                    <strong>Ghi chú / Tiến trình:</strong>
                    <div style={{ whiteSpace: "pre-line", marginTop: 4 }}>{selectedInjury.notes}</div>
                  </div>
                )}

                <div className={styles.timeline}>
                  <div className={styles.timelineNode}>
                    <div className={styles.timelineDot} />
                    <strong>Phát hiện tổn thương</strong>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>{selectedInjury.detectedDate}</span>
                  </div>
                  {selectedInjury.updatedDate && (
                    <div className={styles.timelineNode}>
                      <div className={styles.timelineDot} />
                      <strong>Cập nhật: {STAGE_LABELS[selectedInjury.stage]}</strong>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>{selectedInjury.updatedDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Injury (DL-3.10) */}
      {addModalPoint && (
        <Modal
          title="Đánh dấu điểm chấn thương mới (DL-3.10)"
          subtitle={`Vị trí: ${view === "LEFT" ? "Bên trái" : "Bên phải"} · Tọa độ (${addModalPoint.x}%, ${addModalPoint.y}%)`}
          width={480}
          onClose={() => setAddModalPoint(null)}
          foot={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
              <Button tone="ghost" onClick={() => setAddModalPoint(null)}>Hủy</Button>
              <Button tone="primary" onClick={handleSaveNewInjury}>Lưu điểm chấn thương</Button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Vùng giải phẫu *">
              <Select options={REGION_OPTIONS} value={formRegion} onChange={(e) => setFormRegion(e.target.value)} />
            </Field>

            <Field label="Loại tổn thương *" hint="VD: Viêm gân, Rạn xương, Bầm dập cơ...">
              <Input
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                placeholder="Nhập loại chấn thương..."
                required
              />
            </Field>

            <Field label="Mức độ nghiêm trọng *">
              <Select options={SEVERITY_OPTIONS} value={formSeverity} onChange={(e) => setFormSeverity(e.target.value as SeverityLevel)} />
            </Field>

            <Field label="Mô tả lâm sàng & chỉ dẫn">
              <Textarea
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Ghi nhận kích thước ổ viêm, phản ứng đau..."
              />
            </Field>
          </div>
        </Modal>
      )}

      {/* Modal Update Stage (DL-3.11) */}
      {showStageModal && selectedInjury && (
        <Modal
          title={`Cập nhật tiến trình hồi phục: ${selectedInjury.region} (DL-3.11)`}
          subtitle={`Hiện tại: ${STAGE_LABELS[selectedInjury.stage]}`}
          width={460}
          onClose={() => setShowStageModal(false)}
          foot={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
              <Button tone="ghost" onClick={() => setShowStageModal(false)}>Hủy</Button>
              <Button tone="primary" onClick={handleUpdateStage}>Xác nhận chuyển giai đoạn</Button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Giai đoạn mới *">
              <Select
                options={[
                  { value: "ACUTE", label: "Cấp tính (Acute)" },
                  { value: "SUBACUTE", label: "Bán cấp (Subacute)" },
                  { value: "RECOVERING", label: "Hồi phục (Recovering)" },
                  { value: "HEALED", label: "Đã lành (Healed)" },
                ]}
                value={newStage}
                onChange={(e) => setNewStage(e.target.value as InjuryStage)}
              />
            </Field>

            <Field label="Ghi chú đánh giá lâm sàng">
              <Textarea
                rows={3}
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                placeholder="Mô tả mức giảm đau, phục hồi vận động, kết quả kiểm tra..."
              />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
