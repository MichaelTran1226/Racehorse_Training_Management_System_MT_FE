import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { useToast } from "@/shared/components/ui/Toast";
import { trainingApi } from "../api";
import type { TrainingPhase } from "../types";
import { getHorses } from "@/features/horses/api";
import type { Horse } from "@/features/horses/types";

export default function PlanWizardPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [horses, setHorses] = useState<Horse[]>([]);

  useEffect(() => {
    getHorses({ limit: 100 }).then((res: any) => {
      const list = Array.isArray(res) ? res : res.items || [];
      setHorses(list);
      if (list.length > 0) setHorseId(list[0].id);
    }).catch(console.error);
  }, []);

  // Form State
  const [name, setName] = useState<string>("");
  const [horseId, setHorseId] = useState<string>("");
  const [target, setTarget] = useState<string>("");
  const [targetDistance, setTargetDistance] = useState<number>(1600);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState<string>("");

  // Phases
  const [phases, setPhases] = useState<TrainingPhase[]>([
    {
      id: "ph-1",
      phaseOrder: 1,
      name: "Giai đoạn 1: Nền tảng & Sức bền cơ bản",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      targetHeartRateMax: 140,
      targetSpeedKmh: 35,
      focus: "Đi bộ, trot đều đặn và canter nhẹ nhàng",
    },
  ]);

  const handleAddPhase = () => {
    const nextOrder = phases.length + 1;
    setPhases([
      ...phases,
      {
        id: `ph-${Date.now()}`,
        phaseOrder: nextOrder,
        name: `Giai đoạn ${nextOrder}: Tăng tốc & Nước rút`,
        startDate: endDate,
        endDate: endDate,
        targetHeartRateMax: 165,
        targetSpeedKmh: 50,
        focus: "Bứt tốc cự ly ngắn, phản xạ xuất phát",
      },
    ]);
  };

  const handleRemovePhase = (index: number) => {
    if (phases.length <= 1) return;
    setPhases(phases.filter((_, i) => i !== index));
  };

  const handlePhaseChange = (index: number, field: keyof TrainingPhase, value: string | number) => {
    const updated = [...phases];
    updated[index] = { ...updated[index], [field]: value };
    setPhases(updated);
  };

  const selectedHorse = horses.find((h) => h.id === horseId);
  const isHorseLocked = selectedHorse?.isMedicalLocked || false;

  const handleSave = async (activate = false) => {
    if (!name.trim()) {
      toast.show("Vui lòng nhập tên giáo án", "warn");
      return;
    }
    if (activate && isHorseLocked) {
      toast.show(
        "Không thể kích hoạt! Ngựa đang bị Khóa huấn luyện y tế. Chỉ có thể Lưu nháp.",
        "danger",
      );
      return;
    }

    try {
      setSubmitting(true);
      const created = await trainingApi.createPlan({
        name,
        horseId,
        horseName: selectedHorse?.name || "Ngựa đua",
        horseCode: selectedHorse?.horseCode || "EQ",
        target,
        targetDistanceMeters: targetDistance,
        startDate,
        endDate,
        notes,
        phases,
        status: activate ? "ACTIVE" : "DRAFT",
      });

      toast.show(
        `Đã tạo giáo án ${created.planCode} (${activate ? "Đang áp dụng" : "Bản nháp"})`,
        "ok",
      );
      navigate("/training/plans");
    } catch {
      toast.show("Lỗi lưu giáo án", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Thiết Lập Giáo Án Huấn Luyện</h1>
        <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Lập kế hoạch phân kỳ tập luyện, mục tiêu thể lực và tự động kiểm tra an toàn y tế
        </p>
      </div>

      {/* Stepper indicator */}
      <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => setStep(1)}
          style={{
            background: "none",
            border: "none",
            fontWeight: step === 1 ? 700 : 500,
            color: step === 1 ? "var(--accent)" : "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.9375rem",
          }}
        >
          1. Thông tin chung & Mục tiêu
        </button>
        <span style={{ color: "var(--text-muted)" }}>›</span>
        <button
          type="button"
          onClick={() => setStep(2)}
          style={{
            background: "none",
            border: "none",
            fontWeight: step === 2 ? 700 : 500,
            color: step === 2 ? "var(--accent)" : "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.9375rem",
          }}
        >
          2. Phân kỳ giai đoạn ({phases.length})
        </button>
        <span style={{ color: "var(--text-muted)" }}>›</span>
        <button
          type="button"
          onClick={() => setStep(3)}
          style={{
            background: "none",
            border: "none",
            fontWeight: step === 3 ? 700 : 500,
            color: step === 3 ? "var(--accent)" : "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.9375rem",
          }}
        >
          3. Kiểm tra y tế & Hoàn tất
        </button>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card pad={24}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <Field label="Tên giáo án huấn luyện" required hint="Ví dụ: Giáo án Tăng cường Thể lực Derby 2026">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên giáo án..." />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Ngựa đua áp dụng" required>
                <Select
                  value={horseId}
                  onChange={(e) => setHorseId(e.target.value)}
                  options={horses.map((h) => ({
                    value: h.id,
                    label: `${h.name} - ${h.isMedicalLocked ? "Có Khóa Y Tế 🔒" : "Khỏe mạnh"}`,
                  }))}
                />
              </Field>

            <Field label="Cự ly thi đấu mục tiêu (mét)" required>
              <Input
                type="number"
                value={targetDistance}
                onChange={(e) => setTargetDistance(Number(e.target.value))}
                min={600}
                max={3200}
                step={200}
              />
            </Field>
          </div>

          <Field label="Mục tiêu huấn luyện cốt lõi" required>
            <Textarea
              rows={2}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Ví dụ: Tối ưu nhịp tim nước rút dưới 175 bpm, tăng độ bền cơ bắp cự ly 1600m..."
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field label="Ngày bắt đầu" required>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>

            <Field label="Ngày kết thúc" required>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>

          <Field label="Ghi chú thêm">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ghi chú nội bộ cho Groom và Nài..." />
          </Field>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
            <Button tone="ghost" onClick={() => navigate("/training/plans")}>
              Hủy
            </Button>
            <Button tone="primary" onClick={() => setStep(2)}>
              Tiếp tục: Phân kỳ giai đoạn →
            </Button>
          </div>
          </div>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {phases.map((ph, idx) => (
            <Card key={ph.id} pad={20}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Giai đoạn #{idx + 1}</h3>
                  {phases.length > 1 && (
                    <Button tone="danger" onClick={() => handleRemovePhase(idx)}>
                      Xóa giai đoạn
                    </Button>
                  )}
                </div>

                <Field label="Tên giai đoạn" required>
                  <Input
                    value={ph.name}
                    onChange={(e) => handlePhaseChange(idx, "name", e.target.value)}
                    placeholder="Ví dụ: Giai đoạn 1: Nền tảng & Sức bền..."
                  />
                </Field>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Field label="Nhịp tim mục tiêu tối đa (bpm)">
                    <Input
                      type="number"
                      value={ph.targetHeartRateMax}
                      onChange={(e) => handlePhaseChange(idx, "targetHeartRateMax", Number(e.target.value))}
                    />
                  </Field>

                  <Field label="Tốc độ mục tiêu tối đa (km/h)">
                    <Input
                      type="number"
                      value={ph.targetSpeedKmh}
                      onChange={(e) => handlePhaseChange(idx, "targetSpeedKmh", Number(e.target.value))}
                    />
                  </Field>
                </div>

                <Field label="Trọng tâm bài tập trong giai đoạn này">
                  <Textarea
                    rows={2}
                    value={ph.focus}
                    onChange={(e) => handlePhaseChange(idx, "focus", e.target.value)}
                    placeholder="Ví dụ: Canter cự ly dài tốc độ ổn định..."
                  />
                </Field>
              </div>
            </Card>
          ))}

          <Button tone="secondary" onClick={handleAddPhase}>
            + Thêm giai đoạn mới
          </Button>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
            <Button tone="ghost" onClick={() => setStep(1)}>
              ← Quay lại
            </Button>
            <Button tone="primary" onClick={() => setStep(3)}>
              Tiếp tục: Kiểm tra y tế & Hoàn tất →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <Card pad={24}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>Xác nhận & Kiểm tra Điều kiện Kích hoạt</h3>

          {isHorseLocked ? (
            <div
              style={{
                padding: "1rem",
                borderRadius: 8,
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>
                🔒 CẢNH BÁO KHÓA HUẤN LUYỆN Y TẾ
              </div>
              <div style={{ fontSize: "0.875rem" }}>
                Ngựa <strong>{selectedHorse?.name}</strong> hiện đang bị Khóa huấn luyện thú y do y lệnh:
                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                  <li>Không được phép kích hoạt giáo án này sang trạng thái Đang áp dụng.</li>
                  <li>Bạn chỉ có thể <strong>Lưu bản nháp</strong> để chuẩn bị trước khi Bác sĩ thú y gỡ khóa.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "1rem",
                borderRadius: 8,
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid var(--ok)",
                color: "var(--ok)",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                ✓ Đủ điều kiện thể lực: Ngựa không có lệnh khóa y tế nào đang hiệu lực.
              </div>
            </div>
          )}

          <div style={{ background: "var(--surface-sunken)", padding: "1rem", borderRadius: 8, fontSize: "0.875rem" }}>
            <div><strong>Tên giáo án:</strong> {name || "Chưa đặt"}</div>
            <div><strong>Cự ly mục tiêu:</strong> {targetDistance}m</div>
            <div><strong>Thời gian:</strong> {startDate} đến {endDate}</div>
            <div><strong>Số giai đoạn:</strong> {phases.length}</div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
            <Button tone="ghost" onClick={() => setStep(2)}>
              ← Quay lại
            </Button>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Button tone="secondary" onClick={() => void handleSave(false)} disabled={submitting}>
                Lưu bản nháp
              </Button>
              <Button
                tone="primary"
                onClick={() => void handleSave(true)}
                disabled={submitting || isHorseLocked}
              >
                Lưu & Kích hoạt giáo án
              </Button>
            </div>
          </div>
        </div>
      </Card>
      )}
    </div>
  );
}
