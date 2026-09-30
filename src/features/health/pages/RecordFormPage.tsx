import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/ui/Icon";
import { useToast } from "@/shared/components/ui/Toast";
import { createRecord, getRecordDetail, updateRecord } from "../api";
import { isHeartRateWarning, isRespiratoryWarning, isTempWarning } from "../components/VitalsDisplay";
import type { LabTestItem, SeverityLevel } from "../types";
import styles from "./MedicalRecordPage.module.css";

const HORSE_OPTIONS = [
  { value: "horse-1", label: "Thunderbolt Swift (RFID-985141002341)" },
  { value: "horse-2", label: "Northern Dancer Legacy (RFID-985141002342)" },
  { value: "horse-3", label: "Red Rum Champion (RFID-985141002343)" },
  { value: "horse-4", label: "Secretariat Star (RFID-985141002344)" },
];

const EXAM_TYPE_OPTIONS = [
  { value: "Khám bệnh", label: "Khám bệnh" },
  { value: "Khám chấn thương", label: "Khám chấn thương" },
  { value: "Khám định kỳ", label: "Khám định kỳ" },
  { value: "Tái khám", label: "Tái khám" },
  { value: "Khám trước thi đấu", label: "Khám trước thi đấu" },
];

const DISCOVERY_OPTIONS = [
  { value: "VET tự phát hiện", label: "VET tự phát hiện" },
  { value: "Ghi chú quan sát của nhân viên chăm sóc", label: "Ghi chú quan sát của nhân viên chăm sóc" },
  { value: "Dấu hiệu bất thường sau buổi tập", label: "Dấu hiệu bất thường sau buổi tập" },
  { value: "Khám định kỳ", label: "Khám định kỳ" },
];

const LAB_TYPE_OPTIONS = [
  { value: "Xét nghiệm máu", label: "Xét nghiệm máu" },
  { value: "Nước tiểu", label: "Xét nghiệm nước tiểu" },
  { value: "X-quang", label: "Chụp X-quang" },
  { value: "Siêu âm", label: "Siêu âm cơ xương" },
  { value: "Nội soi", label: "Nội soi đường hô hấp" },
  { value: "Khác", label: "Khác" },
];

const PROPOSED_STATUS_OPTIONS = [
  { value: "UNDER_OBSERVATION", label: "Cần theo dõi (Under Observation)" },
  { value: "INJURED", label: "Chấn thương (Injured)" },
  { value: "QUARANTINED", label: "Cách ly (Quarantined)" },
  { value: "FIT", label: "Đủ điều kiện (Fit)" },
];

export default function RecordFormPage() {
  const { id } = useParams(); // Nếu có id là mode edit
  const [searchParams] = useSearchParams();
  const horseIdParam = searchParams.get("horseId") || "";

  const navigate = useNavigate();
  const toast = useToast();

  const isEdit = Boolean(id);

  // Block 1: Thông tin khám
  const [horseId, setHorseId] = useState(horseIdParam || "horse-1");
  const [examinationDate, setExaminationDate] = useState(new Date().toISOString().slice(0, 16));
  const [examinationType, setExaminationType] = useState("Khám bệnh");
  const [examinationReason, setExaminationReason] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [discoverySource, setDiscoverySource] = useState("VET tự phát hiện");

  // Block 2: Chỉ số sinh tồn
  const [temperature, setTemperature] = useState<number | undefined>(38.1);
  const [restingHeartRate, setRestingHeartRate] = useState<number | undefined>(36);
  const [respiratoryRate, setRespiratoryRate] = useState<number | undefined>(12);
  const [weightKg, setWeightKg] = useState<number | undefined>(480);
  const [clinicalNotes, setClinicalNotes] = useState("");

  // Block 3: Cận lâm sàng
  const [labTests, setLabTests] = useState<LabTestItem[]>([]);

  // Block 4: Chẩn đoán
  const [diagnosis, setDiagnosis] = useState("");
  const [severity, setSeverity] = useState<SeverityLevel>("MODERATE");
  const [proposedStatus, setProposedStatus] = useState("UNDER_OBSERVATION");
  const [proposeMedicalLock, setProposeMedicalLock] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing data if edit mode
  useEffect(() => {
    if (isEdit && id) {
      void getRecordDetail(id).then((res) => {
        const r = res.record;
        setHorseId(r.horseId);
        setExaminationDate(new Date(r.examinationDate).toISOString().slice(0, 16));
        setExaminationType(r.examinationType);
        setExaminationReason(r.examinationReason);
        setSymptoms(r.symptoms || "");
        setDiscoverySource(r.discoverySource || "VET tự phát hiện");
        if (r.vitals) {
          setTemperature(r.vitals.temperature);
          setRestingHeartRate(r.vitals.restingHeartRate);
          setRespiratoryRate(r.vitals.respiratoryRate);
          setWeightKg(r.vitals.weightKg);
          setClinicalNotes(r.vitals.clinicalNotes || "");
        }
        setLabTests(r.labTests || []);
        setDiagnosis(r.diagnosis || "");
        setSeverity(r.severity || "MODERATE");
        setProposedStatus(r.proposedStatus || "UNDER_OBSERVATION");
        setProposeMedicalLock(Boolean(r.proposeMedicalLock));
      });
    }
  }, [isEdit, id]);

  function addLabTest() {
    setLabTests([
      ...labTests,
      {
        testType: "Xét nghiệm máu",
        testDate: new Date().toISOString().split("T")[0],
        result: "",
      },
    ]);
  }

  function removeLabTest(index: number) {
    setLabTests(labTests.filter((_, i) => i !== index));
  }

  function updateLabTest(index: number, key: keyof LabTestItem, value: string) {
    const next = [...labTests];
    next[index] = { ...next[index], [key]: value };
    setLabTests(next);
  }

  async function handleSave(saveAsDraft: boolean) {
    if (!horseId) {
      setError("Vui lòng chọn ngựa.");
      return;
    }
    if (!saveAsDraft) {
      if (!examinationReason.trim()) {
        setError("Vui lòng nhập lý do khám.");
        return;
      }
      if (!diagnosis.trim()) {
        setError("Vui lòng nhập chẩn đoán trước khi chốt bệnh án.");
        return;
      }
    }

    setBusy(true);
    setError(null);

    const payload = {
      horseId,
      examinationDate: new Date(examinationDate).toISOString(),
      examinationType,
      examinationReason: examinationReason.trim(),
      symptoms: symptoms.trim() || undefined,
      discoverySource,
      vitals: {
        temperature: temperature !== undefined ? Number(temperature) : undefined,
        restingHeartRate: restingHeartRate !== undefined ? Number(restingHeartRate) : undefined,
        respiratoryRate: respiratoryRate !== undefined ? Number(respiratoryRate) : undefined,
        weightKg: weightKg !== undefined ? Number(weightKg) : undefined,
        clinicalNotes: clinicalNotes.trim() || undefined,
      },
      labTests: labTests.filter((t) => t.result.trim() !== ""),
      diagnosis: diagnosis.trim() || undefined,
      severity,
      proposedStatus,
      proposeMedicalLock,
      saveAsDraft,
    };

    try {
      if (isEdit && id) {
        const updated = await updateRecord(id, payload);
        toast.show("Cập nhật bệnh án thành công.", "ok");
        navigate(`/medical/records/${updated.record.id}`);
      } else {
        const created = await createRecord(payload);
        toast.show(
          saveAsDraft ? "Đã lưu nháp bệnh án thành công." : "Tạo và chốt bệnh án thành công.",
          "ok",
        );
        navigate(`/medical/records/${created.record.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi lưu bệnh án.");
    } finally {
      setBusy(false);
    }
  }

  const tempWarn = isTempWarning(temperature);
  const hrWarn = isHeartRateWarning(restingHeartRate);
  const rrWarn = isRespiratoryWarning(respiratoryRate);

  return (
    <div className={styles.container}>
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <h1 className={styles.horseTitle}>
              {isEdit ? "Chỉnh sửa Bệnh án (Nháp)" : "Tạo mới Bệnh án Điện tử (SC-3.03)"}
            </h1>
            <span style={{ fontSize: "14px", color: "var(--muted)" }}>
              Nhập kết quả khám lâm sàng, chỉ số sinh tồn và thiết lập phác đồ điều trị ban đầu.
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ color: "var(--danger)", padding: "12px 16px", background: "var(--danger-bg)", borderRadius: "8px", border: "1px solid var(--danger)" }}>
          {error}
        </div>
      )}

      {/* Khối 1: Thông tin khám */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <Icon name="clipboard" size={18} />
          1. Thông tin khám
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          <Field label="Chiến mã *" hint="Chọn con ngựa cần khám chữa">
            <Select
              options={HORSE_OPTIONS}
              value={horseId}
              onChange={(e) => setHorseId(e.target.value)}
              disabled={isEdit}
            />
          </Field>

          <Field label="Ngày giờ khám *">
            <Input
              type="datetime-local"
              value={examinationDate}
              onChange={(e) => setExaminationDate(e.target.value)}
              required
            />
          </Field>

          <Field label="Loại khám *">
            <Select
              options={EXAM_TYPE_OPTIONS}
              value={examinationType}
              onChange={(e) => setExaminationType(e.target.value)}
            />
          </Field>

          <Field label="Nguồn phát hiện">
            <Select
              options={DISCOVERY_OPTIONS}
              value={discoverySource}
              onChange={(e) => setDiscoverySource(e.target.value)}
            />
          </Field>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Lý do khám *" hint="Từ 5 đến 500 ký tự">
              <Textarea
                rows={2}
                value={examinationReason}
                onChange={(e) => setExaminationReason(e.target.value)}
                placeholder="VD: Ngựa có biểu hiện khập khiễng chân trước sau bài tập galop sáng nay..."
                required
              />
            </Field>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Triệu chứng lâm sàng quan sát được" hint="Tối đa 2000 ký tự">
              <Textarea
                rows={2}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="VD: Sưng nề nhẹ vùng khớp cổ chân, ấn có phản xạ đau..."
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Khối 2: Chỉ số sinh tồn */}
      <div className={styles.sectionCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className={styles.sectionTitle}>
            <Icon name="pulse" size={18} />
            2. Chỉ số sinh tồn
          </h2>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>
            Hệ thống sẽ tô đỏ các chỉ số vượt ngưỡng tham chiếu sinh lý của ngựa trưởng thành.
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <Field
            label="Nhiệt độ (°C) *"
            hint={tempWarn ? "Ngoài ngưỡng tham chiếu (37.2 - 38.6 °C)!" : "Bình thường: 37.2 – 38.6 °C"}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Input
                type="number"
                step="0.1"
                min={35}
                max={43}
                value={temperature ?? ""}
                onChange={(e) => setTemperature(e.target.value ? Number(e.target.value) : undefined)}
                style={tempWarn ? { borderColor: "var(--danger)", color: "var(--danger)" } : undefined}
                required
              />
              {tempWarn && <Badge tone="danger">Cảnh báo</Badge>}
            </div>
          </Field>

          <Field
            label="Nhịp tim lúc nghỉ (bpm) *"
            hint={hrWarn ? "Ngoài ngưỡng tham chiếu (28 - 44 bpm)!" : "Bình thường: 28 – 44 bpm"}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Input
                type="number"
                min={20}
                max={120}
                value={restingHeartRate ?? ""}
                onChange={(e) => setRestingHeartRate(e.target.value ? Number(e.target.value) : undefined)}
                style={hrWarn ? { borderColor: "var(--danger)", color: "var(--danger)" } : undefined}
                required
              />
              {hrWarn && <Badge tone="danger">Cảnh báo</Badge>}
            </div>
          </Field>

          <Field
            label="Nhịp thở (lần/phút) *"
            hint={rrWarn ? "Ngoài ngưỡng tham chiếu (8 - 16 lần/phút)!" : "Bình thường: 8 – 16 lần/phút"}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Input
                type="number"
                min={4}
                max={60}
                value={respiratoryRate ?? ""}
                onChange={(e) => setRespiratoryRate(e.target.value ? Number(e.target.value) : undefined)}
                style={rrWarn ? { borderColor: "var(--danger)", color: "var(--danger)" } : undefined}
                required
              />
              {rrWarn && <Badge tone="danger">Cảnh báo</Badge>}
            </div>
          </Field>

          <Field label="Cân nặng (kg)" hint="Tiêu chuẩn: 200 – 800 kg">
            <Input
              type="number"
              min={200}
              max={800}
              value={weightKg ?? ""}
              onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : undefined)}
            />
          </Field>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Khám lâm sàng chi tiết *" hint="10 đến 4000 ký tự">
              <Textarea
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Ghi nhận tiếng thở phổi, âm ruột, niêm mạc mắt, độ đàn hồi của da, dáng đi..."
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Khối 3: Cận lâm sàng */}
      <div className={styles.sectionCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className={styles.sectionTitle}>
            <Icon name="file" size={18} />
            3. Xét nghiệm & Chẩn đoán hình ảnh (0 – 20 dòng)
          </h2>
          <Button size="sm" tone="ghost" icon="plus" onClick={addLabTest}>
            Thêm kết quả xét nghiệm
          </Button>
        </div>

        {labTests.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: "13px" }}>
            Chưa có xét nghiệm cận lâm sàng nào được thêm. Bấm "Thêm kết quả" nếu có kết quả máu, X-quang hoặc siêu âm.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {labTests.map((test, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 3fr auto",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px",
                  background: "var(--surface-2)",
                  borderRadius: "6px",
                }}
              >
                <Select
                  options={LAB_TYPE_OPTIONS}
                  value={test.testType}
                  onChange={(e) => updateLabTest(idx, "testType", e.target.value)}
                />

                <Input
                  type="date"
                  value={test.testDate}
                  onChange={(e) => updateLabTest(idx, "testDate", e.target.value)}
                />

                <Input
                  value={test.result}
                  onChange={(e) => updateLabTest(idx, "result", e.target.value)}
                  placeholder="Mô tả kết quả chữ (VD: Bạch cầu tăng, hình ảnh gãy nứt xương nhẹ...)"
                />

                <button
                  type="button"
                  onClick={() => removeLabTest(idx)}
                  style={{ border: "none", background: "transparent", color: "var(--danger)", cursor: "pointer" }}
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Khối 4: Chẩn đoán & Đề xuất */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <Icon name="stethoscope" size={18} />
          4. Chẩn đoán xác định & Đề xuất xử lý
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Chẩn đoán xác định *" hint="Từ 5 đến 1000 ký tự">
            <Textarea
              rows={3}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="VD: Viêm bao hoạt dịch gân gấp ngón chân trước bên trái cấp tính..."
              required
            />
          </Field>

          <Field label="Mức độ nghiêm trọng *">
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="severity"
                  checked={severity === "MILD"}
                  onChange={() => setSeverity("MILD")}
                />
                Nhẹ (Mild)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="severity"
                  checked={severity === "MODERATE"}
                  onChange={() => setSeverity("MODERATE")}
                />
                Trung bình (Moderate)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="severity"
                  checked={severity === "SEVERE"}
                  onChange={() => setSeverity("SEVERE")}
                />
                Nặng (Severe)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="severity"
                  checked={severity === "CRITICAL"}
                  onChange={() => setSeverity("CRITICAL")}
                />
                Nguy kịch (Critical)
              </label>
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "center" }}>
            <Field label="Đề xuất trạng thái cho ngựa">
              <Select
                options={PROPOSED_STATUS_OPTIONS}
                value={proposedStatus}
                onChange={(e) => setProposedStatus(e.target.value)}
              />
            </Field>

            <div>
              <Checkbox
                label="Đề xuất kích hoạt Khóa huấn luyện (Training Lock)"
                checked={proposeMedicalLock}
                onChange={setProposeMedicalLock}
              />
              <span style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginTop: 4 }}>
                Khi chốt bệnh án, hệ thống sẽ mở bước xác nhận đặt lệnh khóa bảo vệ chiến mã.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          marginTop: 8,
        }}
      >
        <Button tone="ghost" onClick={() => navigate(-1)} disabled={busy}>
          Hủy bỏ
        </Button>

        <div style={{ display: "flex", gap: 12 }}>
          <Button tone="ghost" icon="file" onClick={() => void handleSave(true)} disabled={busy}>
            Lưu nháp (DRAFT)
          </Button>
          <Button tone="primary" icon="checkCircle" onClick={() => void handleSave(false)} disabled={busy}>
            Lưu và chốt bệnh án (OPEN)
          </Button>
        </div>
      </div>
    </div>
  );
}
