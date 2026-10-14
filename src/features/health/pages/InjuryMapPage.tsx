import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/ui/Icon";
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
  RECOVERING: "var(--warn)",
  HEALED: "var(--ok)",
};

const STAGE_LABELS: Record<InjuryStage, string> = {
  ACUTE: "Acute",
  SUBACUTE: "Subacute",
  RECOVERING: "Recovering",
  HEALED: "Healed",
};

const MUSCLE_REGION_OPTIONS = [
  { value: "Superficial Digital Flexor Tendon (SDFT)", label: "Superficial Digital Flexor Tendon (SDFT)" },
  { value: "Deep Digital Flexor Tendon (DDFT)", label: "Deep Digital Flexor Tendon (DDFT)" },
  { value: "Suspensory Ligament", label: "Suspensory Ligament" },
  { value: "Shoulder Muscle (Deltoid & Triceps)", label: "Shoulder Muscle Group (Deltoideus / Triceps)" },
  { value: "Gluteal Muscle Group (Rump)", label: "Gluteal Muscle Group (Rump / Croup)" },
  { value: "Back (Longissimus Dorsi)", label: "Back Muscle (Longissimus Dorsi)" },
  { value: "Neck (Brachiocephalicus)", label: "Neck Muscle (Brachiocephalicus)" },
  { value: "Hamstrings (Biceps Femoris)", label: "Hamstring Group (Biceps Femoris)" },
  { value: "Pectoral Muscle Group", label: "Pectoral Muscle Group (Chest)" },
];

const SKELETON_REGION_OPTIONS = [
  { value: "Left Cannon Bone (MC3)", label: "Cannon Bone (Third Metacarpal MC3)" },
  { value: "Left Hock Joint (Tarsus)", label: "Hock Joint (Tarsal Bones / Calcaneus)" },
  { value: "Fetlock Joint & Proximal Sesamoid", label: "Fetlock Joint & Proximal Sesamoids" },
  { value: "Carpus (Knee Joint)", label: "Carpal Joint (Radial / Intermediate Bones)" },
  { value: "Scapula (Shoulder Blade)", label: "Scapula (Shoulder Blade & Spine)" },
  { value: "Pelvis (Ilium & Ischium)", label: "Pelvis (Sacroiliac / Coxal Joint)" },
  { value: "Thoracic Vertebrae & Ribs", label: "Thoracic Vertebrae & Ribs" },
  { value: "Cervical Vertebrae (C1-C7)", label: "Cervical Vertebrae (C1-C7)" },
  { value: "Pastern & Coffin Bone (P1-P3)", label: "Pastern & Pedal / Coffin Bone" },
  { value: "Splint Bone (MC2 / MC4)", label: "Splint Bone (Metacarpal II / IV)" },
];

const SEVERITY_OPTIONS = [
  { value: "MILD", label: "Mild (Grade 1)" },
  { value: "MODERATE", label: "Moderate (Grade 2)" },
  { value: "SEVERE", label: "Severe (Grade 3)" },
  { value: "CRITICAL", label: "Critical (Grade 4)" },
];

interface PointInjury extends InjuryItem {
  x: number; // % coordinates on canvas
  y: number;
}

import { getHorseInjuries, createInjury, updateInjury, deleteInjury } from "../api";
import { getHorseById, getHorses } from "@/features/horses/api";
import type { Horse } from "@/features/horses/types";
import { formatDate } from "@/shared/lib/format";

import { tr } from "@/shared/i18n/tr";
export default function InjuryMapPage() {
  const { id = "horse-1" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const isVet = user?.role === "VETERINARIAN";
  const [horse, setHorse] = useState<Horse | null>(null);
  const [availableHorses, setAvailableHorses] = useState<Horse[]>([]);

  const [view, setView] = useState<"LEFT" | "RIGHT">("LEFT");
  const [layer, setLayer] = useState<"MUSCLE" | "SKELETON">("MUSCLE");
  const [markingMode, setMarkingMode] = useState(false);
  const [showHealed, setShowHealed] = useState(false);

  const [injuries, setInjuries] = useState<PointInjury[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    getHorses({ limit: 100 })
      .then((res) => {
        if (res && Array.isArray(res.items)) {
          setAvailableHorses(res.items);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let active = true;
    if (id) {
      getHorseById(id)
        .then((res: any) => {
          if (active) setHorse(res.data || res);
        })
        .catch(console.error);

      getHorseInjuries(id)
        .then((res: any) => {
          if (!active) return;
          const list = Array.isArray(res) ? res : res.injuries || [];
          const mappedList: PointInjury[] = list.map((item: any) => {
            const rawX = item.coordinateX ?? item.x ?? 0.5;
            const rawY = item.coordinateY ?? item.y ?? 0.5;
            const x = rawX <= 1 ? Math.round(rawX * 100) : Math.round(rawX);
            const y = rawY <= 1 ? Math.round(rawY * 100) : Math.round(rawY);
            return {
              ...item,
              x,
              y,
              region: item.anatomicalZone || item.region || "Anatomical Zone",
              view: item.viewSide || item.view || "LEFT",
            };
          });
          setInjuries(mappedList);
          setSelectedId(mappedList[0]?.id || null);
        })
        .catch(console.error);
    }
    return () => {
      active = false;
    };
  }, [id]);

  // Dialogs & Actions
  const [addModalPoint, setAddModalPoint] = useState<{ x: number; y: number } | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [repositioningId, setRepositioningId] = useState<string | null>(null);

  // Form add
  const [formRegion, setFormRegion] = useState("Superficial Digital Flexor Tendon (SDFT)");
  const [formType, setFormType] = useState("");
  const [formSeverity, setFormSeverity] = useState<SeverityLevel>("MODERATE");
  const [formNotes, setFormNotes] = useState("");

  // Form update stage
  const [newStage, setNewStage] = useState<InjuryStage>("SUBACUTE");
  const [stageNotes, setStageNotes] = useState("");

  function handleLayerChange(newLayer: "MUSCLE" | "SKELETON") {
    setLayer(newLayer);
    const options = newLayer === "MUSCLE" ? MUSCLE_REGION_OPTIONS : SKELETON_REGION_OPTIONS;
    setFormRegion(options[0].value);
    setRepositioningId(null);
  }

  // Filter injuries by orientation view, layer, and healed status
  const visibleInjuries = injuries.filter((inj) => {
    if (inj.view !== view) return false;
    if (inj.layer !== layer) return false;
    if (!showHealed && inj.stage === "HEALED") return false;
    return true;
  });

  // Ensure selected injury always belongs to the active visible set
  const activeSelectedId = visibleInjuries.some((i) => i.id === selectedId)
    ? selectedId
    : visibleInjuries[0]?.id || null;

  const selectedInjury = injuries.find((i) => i.id === activeSelectedId);

  function getErrorMessage(error: any, fallback: string): string {
    const msg = error?.response?.data?.message || error?.message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string" && msg.trim()) return msg;
    return fallback;
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!isVet) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    // If currently relocating an existing pin
    if (repositioningId) {
      const normX = Number((x / 100).toFixed(4));
      const normY = Number((y / 100).toFixed(4));
      updateInjury(repositioningId, { coordinateX: normX, coordinateY: normY })
        .then(() => {
          const updated = injuries.map((inj) => (inj.id === repositioningId ? { ...inj, x, y } : inj));
          setInjuries(updated);
          const target = injuries.find((i) => i.id === repositioningId);
          setRepositioningId(null);
          toast.show(
            `Pin "${target?.region || "lesion"}" relocated to new coordinates (${x}%, ${y}%).`,
            "ok",
          );
        })
        .catch((error) => {
          toast.show(getErrorMessage(error, "Failed to relocate injury point."), "danger");
          console.error(error);
        });
      return;
    }

    // If in marking mode to place a new pin
    if (markingMode) {
      setAddModalPoint({ x, y });
      setMarkingMode(false);
    }
  }

  async function handleSaveNewInjury() {
    if (!addModalPoint || !formType.trim()) return;
    try {
      const normX = Number((addModalPoint.x / 100).toFixed(4));
      const normY = Number((addModalPoint.y / 100).toFixed(4));
      const payload = {
        horseId: id,
        coordinateX: normX,
        coordinateY: normY,
        viewSide: view,
        layer,
        anatomicalZone: formRegion,
        bodySide: view,
        injuryType: formType.trim(),
        severity: formSeverity,
        stage: "ACUTE",
        description: formNotes.trim() || undefined,
        discoveryDate: new Date().toISOString(),
      };
      const res: any = await createInjury(payload);
      const item = res.injury || res;
      const rawX = item.coordinateX ?? item.x ?? addModalPoint.x;
      const rawY = item.coordinateY ?? item.y ?? addModalPoint.y;
      const x = rawX <= 1 ? Math.round(rawX * 100) : Math.round(rawX);
      const y = rawY <= 1 ? Math.round(rawY * 100) : Math.round(rawY);
      const newInj: PointInjury = {
        ...item,
        x,
        y,
        region: item.anatomicalZone || item.region || formRegion,
        view: item.viewSide || item.view || view,
      };

      const updated = [...injuries, newInj];
      setInjuries(updated);
      setSelectedId(newInj.id);
      setAddModalPoint(null);
      setFormType("");
      setFormNotes("");
      toast.show("New anatomical injury point recorded successfully.", "ok");
    } catch (error) {
      toast.show(getErrorMessage(error, "Failed to create injury point."), "danger");
      console.error(error);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTargetId) return;
    try {
      await deleteInjury(deleteTargetId);
      const target = injuries.find((i) => i.id === deleteTargetId);
      const remaining = injuries.filter((i) => i.id !== deleteTargetId);
      setInjuries(remaining);
      if (selectedId === deleteTargetId) {
        const nextVisible = remaining.filter((i) => i.view === view && i.layer === layer);
        setSelectedId(nextVisible[0]?.id || null);
      }
      setDeleteTargetId(null);
      toast.show(`Injury point "${target?.region || ""}" deleted successfully.`, "ok");
    } catch (error) {
      toast.show(getErrorMessage(error, "Failed to delete injury point."), "danger");
      console.error(error);
    }
  }

  async function handleUpdateStage() {
    if (!selectedInjury) return;
    try {
      const payload: any = { stage: newStage };
      if (stageNotes.trim()) {
        payload.description = `${selectedInjury.notes || ""}\n- [${formatDate(new Date())}]: ${stageNotes.trim()}`;
      }
      
      await updateInjury(selectedInjury.id, payload);
      
      const updated = injuries.map((inj) => {
        if (inj.id === selectedInjury.id) {
          return {
            ...inj,
            stage: newStage,
            updatedDate: new Date().toISOString().split("T")[0],
            notes: payload.description || inj.notes,
          };
        }
        return inj;
      });
      setInjuries(updated);
      setShowStageModal(false);
      setStageNotes("");
      toast.show(`Recovery stage updated to: ${newStage}.`, "ok");
    } catch (error) {
      toast.show(getErrorMessage(error, "Failed to update injury stage."), "danger");
      console.error(error);
    }
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button tone="ghost" icon="arrowLeft" onClick={() => navigate(horse ? `/medical/horses/${id}` : "/medical/herd")}>
            {horse ? tr("Medical Record") : tr("Herd Health")}
          </Button>
          <div>
            <h1 style={{ fontSize: "var(--fs-section)", fontWeight: 700, margin: 0, color: "var(--ink)" }}>
              <span>{tr("2D Anatomical Injury Map")}</span>
              {horse && <span>{` · ${horse.name} (${horse.horseCode || horse.id.slice(0,6)})`}</span>}
            </h1>
            <span style={{ fontSize: "var(--fs-body)", color: "var(--muted)" }}>
              {horse
                ? tr(`Pinpoint anatomical lesions and monitor clinical progression for ${horse.name}.`)
                : tr("Pinpoint anatomical lesions and monitor clinical progression across recovery phases.")}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {availableHorses.length > 0 && (
            <div style={{ minWidth: 220 }}>
              <Select
                value={id}
                onChange={(newId) => navigate(`/health/injury-map/${newId}`)}
                options={availableHorses.map((h) => ({
                  value: h.id,
                  label: `${h.name} (${h.horseCode || h.id.slice(0, 6)})`,
                }))}
              />
            </div>
          )}

          {isVet && (
            <Button
              tone={markingMode ? "danger" : "primary"}
              icon="pin"
              onClick={() => setMarkingMode(!markingMode)}
            >
              {markingMode ? tr("Marking Mode Active (Click on model)") : tr("Enable Marking Mode")}
            </Button>
          )}
        </div>
      </div>

      <div className={styles.mainLayout}>
        {/* Model 2D Canvas */}
        <div className={styles.modelCard}>
          <div className={styles.toolbar}>
            <div className={styles.toggleGroup}>
              <span style={{ fontSize: "var(--fs-body)", fontWeight: 600, color: "var(--muted)" }}>{tr("View:")}</span>
              <Button
                size="sm"
                tone={view === "LEFT" ? "primary" : "ghost"}
                onClick={() => setView("LEFT")}
              >
                {tr("Left View")}
              </Button>
              <Button
                size="sm"
                tone={view === "RIGHT" ? "primary" : "ghost"}
                onClick={() => setView("RIGHT")}
              >
                {tr("Right View")}
              </Button>
            </div>

            <div className={styles.toggleGroup}>
              <span style={{ fontSize: "var(--fs-body)", fontWeight: 600, color: "var(--muted)" }}>{tr("Anatomy Layer:")}</span>
              <Button
                size="sm"
                tone={layer === "MUSCLE" ? "primary" : "ghost"}
                onClick={() => handleLayerChange("MUSCLE")}
              >
                {tr("Muscular Layer")}
              </Button>
              <Button
                size="sm"
                tone={layer === "SKELETON" ? "primary" : "ghost"}
                onClick={() => handleLayerChange("SKELETON")}
              >
                {tr("Skeletal Layer")}
              </Button>
            </div>

            <Checkbox
              label={tr("Show healed injuries")}
              checked={showHealed}
              onChange={setShowHealed}
            />
          </div>

          {/* Active Mode Prompts */}
          {repositioningId && (
            <div
              className="notranslate"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--warn-bg)",
                border: "1px solid var(--warn)",
                color: "var(--ink)",
                padding: "8px 14px",
                borderRadius: "var(--r-sm)",
                marginBottom: "12px",
                fontSize: "var(--fs-body)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex" }}><Icon name="pin" size={18} /></span>
                <span>
                  <strong>{tr("Repositioning Mode:")}</strong> Click any spot on the {layer === "MUSCLE" ? tr("Muscular") : tr("Skeletal")} {tr("model to relocate pin #")}{visibleInjuries.findIndex((i) => i.id === repositioningId) + 1} ({injuries.find((i) => i.id === repositioningId)?.region}).
                </span>
              </div>
              <Button size="sm" tone="ghost" onClick={() => setRepositioningId(null)}>
                {tr("Cancel Move")}
              </Button>
            </div>
          )}

          {markingMode && (
            <div
              className="notranslate"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--ok-bg)",
                border: "1px solid var(--ok)",
                color: "var(--ink)",
                padding: "8px 14px",
                borderRadius: "var(--r-sm)",
                marginBottom: "12px",
                fontSize: "var(--fs-body)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex" }}><Icon name="flag" size={18} /></span>
                <span>
                  <strong>{tr("Marking Mode Active:")}</strong> Click anywhere on the {layer === "MUSCLE" ? tr("Muscular") : tr("Skeletal")} model to place a new injury point.
                </span>
              </div>
              <Button size="sm" tone="ghost" onClick={() => setMarkingMode(false)}>
                {tr("Cancel Marking")}
              </Button>
            </div>
          )}

          {/* Canvas SVG Area */}
          <div
            className={cx(styles.canvasArea, (markingMode || Boolean(repositioningId)) && styles.marking)}
          >
            <div
              className={styles.stageWrapper}
              onClick={handleCanvasClick}
            >
              {/* SVG Horse Anatomy Graphic */}
              <HorseAnatomyGraphic view={view} layer={layer} />

              {/* Render Pins for Active Layer */}
              {visibleInjuries.map((inj, idx) => (
                <div
                  key={inj.id}
                  className={cx(styles.pin, inj.id === activeSelectedId && styles.selected, "notranslate")}
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
                  <span>{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", fontSize: "var(--fs-caption)" }}>
            <span style={{ fontWeight: 600 }}>{tr("Recovery Stage Legend:")}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS.ACUTE }} />
              {tr("Acute")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS.SUBACUTE }} />
              {tr("Subacute")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS.RECOVERING }} />
              {tr("Recovering")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS.HEALED }} />
              {tr("Healed")}
            </span>
          </div>
        </div>

        {/* Side Panel */}
        <div className={styles.sidePanel}>
          {/* List of points */}
          <div className={styles.panelCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "var(--fs-body)" }}>
                Injury Points ({visibleInjuries.length}) · {layer === "MUSCLE" ? tr("Muscular") : tr("Skeletal")}
              </strong>
            </div>

            {visibleInjuries.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: "var(--fs-body)" }}>
                No injury points recorded on the {layer === "MUSCLE" ? tr("Muscular") : tr("Skeletal")} layer ({view === "LEFT" ? tr("Left View") : tr("Right View")}).
              </div>
            ) : (
              <div className={styles.injuryList}>
                {visibleInjuries.map((inj, idx) => (
                  <div
                    key={inj.id}
                    className={cx(styles.injuryItem, inj.id === activeSelectedId && styles.active)}
                    onClick={() => setSelectedId(inj.id)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "var(--fs-body)" }}>
                        #{idx + 1} {inj.region}
                      </div>
                      <div style={{ fontSize: "var(--fs-caption)", color: "var(--muted)" }}>{inj.injuryType}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Badge tone={inj.stage === "ACUTE" ? "danger" : inj.stage === "HEALED" ? "ok" : "warn"} dot>
                        {STAGE_LABELS[inj.stage]}
                      </Badge>
                      {isVet && (
                        <button
                          type="button"
                          title={tr("Delete pin")}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(inj.id);
                          }}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "var(--muted)",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "4px",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details of selected point */}
          {selectedInjury && (
            <div className={styles.panelCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <strong style={{ fontSize: "var(--fs-body)" }}>{tr("Injury Details")}</strong>
                {isVet && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Button
                      size="sm"
                      tone={repositioningId === selectedInjury.id ? "danger" : "ghost"}
                      icon="pin"
                      onClick={() => {
                        setMarkingMode(false);
                        setRepositioningId(repositioningId === selectedInjury.id ? null : selectedInjury.id);
                      }}
                      title={tr("Relocate this pin to a different position on the model")}
                    >
                      {repositioningId === selectedInjury.id ? tr("Cancel Move") : tr("Relocate Pin")}
                    </Button>
                    {selectedInjury.stage !== "HEALED" && (
                      <Button size="sm" tone="primary" onClick={() => setShowStageModal(true)}>
                        {tr("Update Recovery")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      tone="danger"
                      icon="trash"
                      onClick={() => setDeleteTargetId(selectedInjury.id)}
                      title={tr("Delete this injury point")}
                    >
                      {tr("Delete")}
                    </Button>
                  </div>
                )}
              </div>

              <div style={{ fontSize: "var(--fs-body)", display: "flex", flexDirection: "column", gap: 8 }}>
                <div>{tr("Region:")}{" "}<strong>{selectedInjury.region}</strong> ({selectedInjury.view === "LEFT" ? tr("Left View") : tr("Right View")} · {selectedInjury.layer === "MUSCLE" ? tr("Muscular") : tr("Skeletal")} Layer)</div>
                <div>{tr("Condition:")}{" "}<strong>{selectedInjury.injuryType}</strong></div>
                <div>
                  {tr("Severity:")}{" "}<Badge tone={selectedInjury.severity === "CRITICAL" ? "danger" : "warn"}>{selectedInjury.severity}</Badge>
                </div>
                <div>
                  {tr("Stage:")}{" "}<Badge tone={selectedInjury.stage === "ACUTE" ? "danger" : "ok"} dot>{STAGE_LABELS[selectedInjury.stage]}</Badge>
                </div>
                <div>{tr("Detected Date:")}{" "}<strong>{formatDate(selectedInjury.detectedDate)}</strong></div>

                {selectedInjury.notes && (
                  <div style={{ background: "var(--surface-2)", padding: "8px 10px", borderRadius: "var(--r-sm)", marginTop: 4 }}>
                    <strong>{tr("Clinical Notes / Progress:")}</strong>
                    <div style={{ whiteSpace: "pre-line", marginTop: 4 }}>{selectedInjury.notes}</div>
                  </div>
                )}

                <div className={styles.timeline}>
                  <div className={styles.timelineNode}>
                    <div className={styles.timelineDot} />
                    <strong>{tr("Initial Diagnosis")}</strong>
                    <span style={{ fontSize: "var(--fs-caption)", color: "var(--muted)" }}>{selectedInjury.detectedDate}</span>
                  </div>
                  {selectedInjury.updatedDate && (
                    <div className={styles.timelineNode}>
                      <div className={styles.timelineDot} />
                      <strong>Phase Update: {STAGE_LABELS[selectedInjury.stage]}</strong>
                      <span style={{ fontSize: "var(--fs-caption)", color: "var(--muted)" }}>{selectedInjury.updatedDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add Injury */}
      {addModalPoint && (
        <Modal
          title={tr("Mark New Injury Point")}
          subtitle={tr(`Layer: ${layer === "MUSCLE" ? "Muscular Layer" : "Skeletal Layer"} · Orientation: ${view === "LEFT" ? "Left View" : "Right View"} · Coordinates (${addModalPoint.x}%, ${addModalPoint.y}%)`)}
          width={480}
          onClose={() => setAddModalPoint(null)}
          foot={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
              <Button tone="ghost" onClick={() => setAddModalPoint(null)}>Cancel</Button>
              <Button tone="primary" onClick={handleSaveNewInjury}>Save Injury Point</Button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label={tr("Anatomical Region *")}>
              <Select
                options={layer === "MUSCLE" ? MUSCLE_REGION_OPTIONS : SKELETON_REGION_OPTIONS}
                value={formRegion}
                onChange={(e) => setFormRegion(e.target.value)}
              />
            </Field>

            <Field label={tr("Injury / Lesion Type *")} hint={tr("e.g. Tendinitis, Bone fissure, Desmitis, Fracture...")}>
              <Input
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                placeholder={tr("Enter injury classification...")}
                required
              />
            </Field>

            <Field label={tr("Severity Level *")}>
              <Select options={SEVERITY_OPTIONS} value={formSeverity} onChange={(e) => setFormSeverity(e.target.value as SeverityLevel)} />
            </Field>

            <Field label={tr("Clinical Notes & Instructions")}>
              <Textarea
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder={tr("Note down lesion size, heat, pain response...")}
              />
            </Field>
          </div>
        </Modal>
      )}

      {/* Modal Update Stage */}
      {showStageModal && selectedInjury && (
        <Modal
          title={tr(`Update Recovery Stage: ${selectedInjury.region}`)}
          subtitle={tr(`Current Phase: ${STAGE_LABELS[selectedInjury.stage]}`)}
          width={460}
          onClose={() => setShowStageModal(false)}
          foot={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
              <Button tone="ghost" onClick={() => setShowStageModal(false)}>Cancel</Button>
              <Button tone="primary" onClick={handleUpdateStage}>Confirm Stage Transition</Button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label={tr("New Recovery Stage *")}>
              <Select
                options={[
                  { value: "ACUTE", label: "Acute" },
                  { value: "SUBACUTE", label: "Subacute" },
                  { value: "RECOVERING", label: "Recovering" },
                  { value: "HEALED", label: "Healed" },
                ]}
                value={newStage}
                onChange={(e) => setNewStage(e.target.value as InjuryStage)}
              />
            </Field>

            <Field label={tr("Clinical Evaluation Notes")}>
              <Textarea
                rows={3}
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                placeholder={tr("Describe pain reduction, gait recovery, palpation feedback...")}
              />
            </Field>
          </div>
        </Modal>
      )}

      {/* Modal Delete Confirmation */}
      {deleteTargetId && (
        <Modal
          title={tr("Delete Injury Point")}
          subtitle={tr("Confirm removal of anatomical lesion marker")}
          width={440}
          onClose={() => setDeleteTargetId(null)}
          foot={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
              <Button tone="ghost" onClick={() => setDeleteTargetId(null)}>
                Cancel
              </Button>
              <Button tone="danger" icon="trash" onClick={handleConfirmDelete}>
                Delete Point
              </Button>
            </div>
          }
        >
          <div style={{ fontSize: "var(--fs-body)", lineHeight: "1.6", color: "var(--ink)" }}>
            {tr("Are you sure you want to delete this injury pin?")}
            <div style={{ margin: "12px 0", padding: "10px 12px", background: "var(--surface-2)", borderRadius: "var(--r-sm)" }}>
              {(() => {
                const target = injuries.find((i) => i.id === deleteTargetId);
                if (!target) return null;
                return (
                  <>
                    <div><strong>{tr("Region:")}</strong> {target.region}</div>
                    <div><strong>{tr("Condition:")}</strong> {target.injuryType}</div>
                    <div><strong>{tr("Layer:")}</strong> {target.layer === "MUSCLE" ? tr("Muscular") : tr("Skeletal")} Layer</div>
                  </>
                );
              })()}
            </div>
            {tr("You can re-mark or create a new pin anytime using")}{" "}<strong>{tr("Enable Marking Mode")}</strong>.
          </div>
        </Modal>
      )}
    </div>
  );
}
