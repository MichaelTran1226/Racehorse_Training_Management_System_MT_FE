import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, useBlocker } from "react-router-dom";
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


const EXAM_TYPE_OPTIONS = [
  { value: "Routine Clinical", label: "Routine Clinical" },
  { value: "Injury Examination", label: "Injury Examination" },
  { value: "Periodic Checkup", label: "Periodic Checkup" },
  { value: "Follow-up", label: "Follow-up" },
  { value: "Pre-Race Veterinary Exam", label: "Pre-Race Veterinary Exam" },
];

const DISCOVERY_OPTIONS = [
  { value: "VET Self-Discovered", label: "VET Self-Discovered" },
  { value: "Groom Observation Log", label: "Groom Observation Log" },
  { value: "Post-Training Abnormality", label: "Post-Training Abnormality" },
  { value: "Routine Checkup", label: "Routine Checkup" },
];

const LAB_TYPE_OPTIONS = [
  { value: "Blood Test", label: "Blood Test" },
  { value: "Urinalysis", label: "Urinalysis" },
  { value: "X-Ray", label: "Radiograph (X-Ray)" },
  { value: "Ultrasound", label: "Musculoskeletal Ultrasound" },
  { value: "Endoscopy", label: "Respiratory Endoscopy" },
  { value: "Other", label: "Other" },
];

const PROPOSED_STATUS_OPTIONS = [
  { value: "UNDER_OBSERVATION", label: "Under Observation" },
  { value: "INJURED", label: "Injured" },
  { value: "QUARANTINED", label: "Quarantined" },
  { value: "FIT", label: "Fit" },
];

import { getHorses } from "@/features/horses/api";


import { tr } from "@/shared/i18n/tr";
export default function RecordFormPage() {
  const { id } = useParams(); // If id exists, it's edit mode
  const [searchParams] = useSearchParams();
  const horseIdParam = searchParams.get("horseId") || "";

  const navigate = useNavigate();
  const toast = useToast();

  const isEdit = Boolean(id);

  // Block 1: Exam info
  const [horseId, setHorseId] = useState(horseIdParam);
  const [horseOptions, setHorseOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingHorses, setLoadingHorses] = useState(true);

  useEffect(() => {
    let active = true;
    getHorses({ limit: 100 })
      .then((res: any) => {
        if (!active) return;
        const data = res.items || res.data || [];
        if (data.length > 0) {
          setHorseOptions(
            data.map((h: any) => ({
              value: h.id,
              label: `${h.name} (${h.horseCode || h.id})`,
            }))
          );
          if (!isEdit && (!horseIdParam || !data.some((h: any) => h.id === horseIdParam))) {
            setHorseId(data[0].id);
          }
        } else {
          setHorseOptions([{ value: "", label: "-- No horses available --" }]);
        }
      })
      .catch(() => {
        // Fallback or error state
        if (active) setHorseOptions([{ value: "", label: "-- Error loading horses --" }]);
      })
      .finally(() => {
        if (active) setLoadingHorses(false);
      });
    return () => {
      active = false;
    };
  }, [horseIdParam, isEdit]);
  const [examinationDate, setExaminationDate] = useState(new Date().toISOString().slice(0, 16));
  const [examinationType, setExaminationType] = useState("Routine Clinical");
  const [examinationReason, setExaminationReason] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [discoverySource, setDiscoverySource] = useState("VET Self-Discovered");

  // Block 2: Vital signs
  const [temperature, setTemperature] = useState<number | undefined>(38.1);
  const [restingHeartRate, setRestingHeartRate] = useState<number | undefined>(36);
  const [respiratoryRate, setRespiratoryRate] = useState<number | undefined>(12);
  const [weightKg, setWeightKg] = useState<number | undefined>(480);
  const [clinicalNotes, setClinicalNotes] = useState("");

  // Block 3: Diagnostics
  const [labTests, setLabTests] = useState<LabTestItem[]>([]);

  // Block 4: Diagnosis
  const [diagnosis, setDiagnosis] = useState("");
  const [severity, setSeverity] = useState<SeverityLevel>("MODERATE");
  const [proposedStatus, setProposedStatus] = useState("UNDER_OBSERVATION");
  const [proposeMedicalLock, setProposeMedicalLock] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // FR-3.20: đóng tab / tải lại khi có thay đổi chưa lưu -> trình duyệt hỏi lại.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // FR-3.20: Chuyển trang qua router / Sidebar khi chưa lưu -> hỏi xác nhận
  const blocker = useBlocker(Boolean(dirty && !busy));

  useEffect(() => {
    if (blocker.state === "blocked") {
      if (window.confirm(tr("You have unsaved changes in this medical record. Leaving will lose them. Continue?"))) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  function handleCancel() {
    if (dirty) {
      if (window.confirm(tr("You have unsaved changes in this medical record. Leaving will lose them. Continue?"))) {
        setDirty(false);
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  }

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
        setDiscoverySource(r.discoverySource || "VET Self-Discovered");
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
        testType: "Blood Test",
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
      setError("Please select a horse.");
      return;
    }
    if (!saveAsDraft) {
      if (!examinationReason.trim()) {
        setError("Please enter reason for examination.");
        return;
      }
      if (!diagnosis.trim()) {
        setError("Please enter a definitive diagnosis before finalizing.");
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
        toast.show("Medical record updated successfully.", "ok");
        setDirty(false);
        navigate(`/medical/records/${updated.record.id}`);
      } else {
        const created = await createRecord(payload);
        toast.show(
          saveAsDraft ? "Draft medical record saved successfully." : "Medical record created and finalized.",
          "ok",
        );
        setDirty(false);
        navigate(`/medical/records/${created.record.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save medical record.");
    } finally {
      setBusy(false);
    }
  }

  const tempWarn = isTempWarning(temperature);
  const hrWarn = isHeartRateWarning(restingHeartRate);
  const rrWarn = isRespiratoryWarning(respiratoryRate);

  return (
    <div
      className={styles.container}
      onInput={() => setDirty(true)}
      onChangeCapture={() => setDirty(true)}
    >
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <h1 className={styles.horseTitle}>
              {isEdit ? tr("Edit Medical Record (Draft)") : tr("New Electronic Medical Record")}
            </h1>
            <span style={{ fontSize: "var(--fs-body)", color: "var(--muted)" }}>
              {tr("Record clinical exam findings, vital signs, and initialize the treatment plan.")}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ color: "var(--danger)", padding: "12px 16px", background: "var(--danger-bg)", borderRadius: "var(--r)", border: "1px solid var(--danger)" }}>
          {error}
        </div>
      )}

      {/* Block 1: Examination Details */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <Icon name="clipboard" size={18} />
          {tr("1. Examination Information")}
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          <Field label={tr("Horse *")} hint={tr("Select the horse to examine")}>
            <Select
              options={horseOptions}
              value={horseId}
              onChange={(e) => setHorseId(e.target.value)}
              disabled={isEdit || loadingHorses}
            />
          </Field>

          <Field label={tr("Examination Date & Time *")}>
            <Input
              type="datetime-local"
              value={examinationDate}
              onChange={(e) => setExaminationDate(e.target.value)}
              required
            />
          </Field>

          <Field label={tr("Examination Type *")}>
            <Select
              options={EXAM_TYPE_OPTIONS}
              value={examinationType}
              onChange={(e) => setExaminationType(e.target.value)}
            />
          </Field>

          <Field label={tr("Discovery Source")}>
            <Select
              options={DISCOVERY_OPTIONS}
              value={discoverySource}
              onChange={(e) => setDiscoverySource(e.target.value)}
            />
          </Field>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label={tr("Reason for Examination *")} hint={tr("Between 5 and 500 characters")}>
              <Textarea
                rows={2}
                value={examinationReason}
                onChange={(e) => setExaminationReason(e.target.value)}
                placeholder={tr("e.g., Horse exhibits front limb lameness following morning gallop workout...")}
                required
              />
            </Field>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label={tr("Observed Clinical Symptoms")} hint={tr("Max 2,000 characters")}>
              <Textarea
                rows={2}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder={tr("e.g., Mild swelling around the fetlock joint, tender on palpation...")}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Block 2: Vital Signs */}
      <div className={styles.sectionCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className={styles.sectionTitle}>
            <Icon name="pulse" size={18} />
            {tr("2. Vital Signs")}
          </h2>
          <span style={{ fontSize: "var(--fs-caption)", color: "var(--muted)" }}>
            {tr("Values exceeding adult equine physiological reference ranges will be highlighted in red.")}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <Field
            label={tr("Temperature (°C) *")}
            hint={tempWarn ? tr("Outside reference range (37.2 – 38.6 °C)!") : tr("Normal: 37.2 – 38.6 °C")}
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
              {tempWarn && <Badge tone="danger">{tr("Alert")}</Badge>}
            </div>
          </Field>

          <Field
            label={tr("Resting Heart Rate (bpm) *")}
            hint={hrWarn ? tr("Outside reference range (28 – 44 bpm)!") : tr("Normal: 28 – 44 bpm")}
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
              {hrWarn && <Badge tone="danger">{tr("Alert")}</Badge>}
            </div>
          </Field>

          <Field
            label={tr("Respiratory Rate (breaths/min) *")}
            hint={rrWarn ? tr("Outside reference range (8 – 16 breaths/min)!") : tr("Normal: 8 – 16 breaths/min")}
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
              {rrWarn && <Badge tone="danger">{tr("Alert")}</Badge>}
            </div>
          </Field>

          <Field label={tr("Weight (kg)")} hint={tr("Standard: 200 – 800 kg")}>
            <Input
              type="number"
              min={200}
              max={800}
              value={weightKg ?? ""}
              onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : undefined)}
            />
          </Field>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label={tr("Detailed Clinical Examination *")} hint={tr("10 to 4,000 characters")}>
              <Textarea
                rows={3}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder={tr("Note lung sounds, gut sounds, mucous membranes, skin turgor, gait...")}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Block 3: Diagnostic Tests */}
      <div className={styles.sectionCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className={styles.sectionTitle}>
            <Icon name="file" size={18} />
            {tr("3. Diagnostic Tests & Imaging (0–20 items)")}
          </h2>
          <Button size="sm" tone="ghost" icon="plus" onClick={addLabTest}>
            {tr("Add Diagnostic Result")}
          </Button>
        </div>

        {labTests.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: "var(--fs-body)" }}>
            {tr("No diagnostic tests added yet. Click &quot;Add Diagnostic Result&quot; to record blood work, X-rays, or ultrasound findings.")}
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
                  borderRadius: "var(--r-sm)",
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
                  placeholder={tr("Result description (e.g., Elevated WBC count, hairline fissure on lateral condyle...)")}
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

      {/* Block 4: Diagnosis & Proposed Actions */}
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>
          <Icon name="stethoscope" size={18} />
          {tr("4. Confirmatory Diagnosis & Proposed Actions")}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label={tr("Definitive Diagnosis *")} hint={tr("Between 5 and 1,000 characters")}>
            <Textarea
              rows={3}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g., Acute tenosynovitis of the left forelimb digital flexor tendon sheath..."
              required
            />
          </Field>

          <Field label={tr("Severity Level *")}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="severity"
                  checked={severity === "MILD"}
                  onChange={() => setSeverity("MILD")}
                />
                {tr("Mild")}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="severity"
                  checked={severity === "MODERATE"}
                  onChange={() => setSeverity("MODERATE")}
                />
                {tr("Moderate")}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="severity"
                  checked={severity === "SEVERE"}
                  onChange={() => setSeverity("SEVERE")}
                />
                {tr("Severe")}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="severity"
                  checked={severity === "CRITICAL"}
                  onChange={() => setSeverity("CRITICAL")}
                />
                {tr("Critical")}
              </label>
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "center" }}>
            <Field label={tr("Proposed Horse Status")}>
              <Select
                options={PROPOSED_STATUS_OPTIONS}
                value={proposedStatus}
                onChange={(e) => setProposedStatus(e.target.value)}
              />
            </Field>

            <div>
              <Checkbox
                label={tr("Propose Training Lock activation")}
                checked={proposeMedicalLock}
                onChange={setProposeMedicalLock}
              />
              <span style={{ fontSize: "var(--fs-caption)", color: "var(--muted)", display: "block", marginTop: 4 }}>
                {tr("Upon finalizing the medical record, a confirmation step will be prompted to issue a protective training lock.")}
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
          borderRadius: "var(--r)",
          marginTop: 8,
        }}
      >
        <Button tone="ghost" onClick={handleCancel} disabled={busy}>
          {tr("Cancel")}
        </Button>

        <div style={{ display: "flex", gap: 12 }}>
          <Button tone="ghost" icon="file" onClick={() => void handleSave(true)} disabled={busy}>
            {tr("Save Draft (DRAFT)")}
          </Button>
          <Button tone="primary" icon="checkCircle" onClick={() => void handleSave(false)} disabled={busy}>
            {tr("Save & Finalize (OPEN)")}
          </Button>
        </div>
      </div>
    </div>
  );
}
