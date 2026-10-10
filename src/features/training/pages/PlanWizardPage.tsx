import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Textarea } from "@/shared/components/form/Textarea";
import { useToast } from "@/shared/components/ui/Toast";
import { getStoredHorses } from "@/shared/mock/horsesData";
import { getHorses } from "@/features/horses/api";
import { trainingApi } from "../api";
import type { TrainingPhase } from "../types";

export default function PlanWizardPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Available horses from store with dynamic fetch reconciliation
  const [horses, setHorses] = useState(() => getStoredHorses());

  useEffect(() => {
    getHorses({ limit: 100 })
      .then((res) => {
        if (res.items && res.items.length > 0) {
          setHorses(res.items as any);
        }
      })
      .catch(() => {});
  }, []);

  // Form State
  const [name, setName] = useState<string>("");
  const [horseId, setHorseId] = useState<string>(() => horses[0]?.id || "horse-1");
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
  const [phases, setPhases] = useState<TrainingPhase[]>(() => [
    {
      id: "ph-1",
      phaseOrder: 1,
      name: "Phase 1: Aerobic Base & Steady Conditioning",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      targetHeartRateMax: 140,
      targetSpeedKmh: 35,
      focus: "Controlled walking, regular trotting, and light canter work",
    },
  ]);

  const selectedHorse = useMemo(() => {
    return horses.find((h) => h.id === horseId) || horses[0];
  }, [horses, horseId]);

  const isHorseLocked = Boolean(selectedHorse?.isLocked);

  const handleAddPhase = () => {
    const nextOrder = phases.length + 1;
    setPhases([
      ...phases,
      {
        id: `ph-${Date.now()}`,
        phaseOrder: nextOrder,
        name: `Phase ${nextOrder}: Speed Progression & Final Sprints`,
        startDate: endDate,
        endDate: endDate,
        targetHeartRateMax: 165,
        targetSpeedKmh: 50,
        focus: "Short-distance bursts and starting gate reaction drills",
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

  const handleSave = async (activate = false) => {
    if (!name.trim()) {
      toast.show("Please enter a training plan name", "warn");
      return;
    }
    if (activate && isHorseLocked) {
      toast.show(
        "Cannot activate! Selected horse is currently under Medical Lock. You may only Save as Draft.",
        "danger",
      );
      return;
    }

    try {
      setSubmitting(true);
      const created = await trainingApi.createPlan({
        name,
        horseId,
        horseName: selectedHorse?.name || "Racehorse",
        horseCode: selectedHorse?.code || selectedHorse?.horseCode || "HR-000001",
        target,
        targetDistanceMeters: targetDistance,
        startDate,
        endDate,
        notes,
        phases,
        status: activate ? "ACTIVE" : "DRAFT",
      });

      toast.show(
        `Plan ${created.planCode} successfully created (${activate ? "Active" : "Draft"})`,
        "ok",
      );
      navigate("/training/plans");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create training plan";
      toast.show(msg, "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Create Training Plan</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.875rem" }}>
            Design periodized conditioning cycles and verify clinical readiness
          </p>
        </div>
        <Button tone="ghost" onClick={() => navigate("/training/plans")}>
          Cancel
        </Button>
      </div>

      {/* Stepper */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { num: 1, label: "1. Basic Details" },
          { num: 2, label: "2. Training Phases" },
          { num: 3, label: "3. Health Review & Finish" },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => setStep(s.num)}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: 8,
              cursor: "pointer",
              background: step === s.num ? "var(--primary-light, #2563eb15)" : "var(--surface-sunken)",
              border: `1px solid ${step === s.num ? "var(--primary)" : "var(--border)"}`,
              color: step === s.num ? "var(--primary)" : "var(--muted)",
              fontWeight: step === s.num ? 700 : 500,
              fontSize: "0.875rem",
              textAlign: "center",
              transition: "all 0.15s ease",
            }}
          >
            {s.label}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card pad={24}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <Field label="Plan Name" required hint="Example: Autumn Derby Endurance & Speed Conditioning">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter plan name..." />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Assigned Racehorse" required>
                <Select
                  value={horseId}
                  onChange={(e) => setHorseId(e.target.value)}
                  options={horses.map((h) => ({
                    value: h.id,
                    label: `${h.name} (${h.code || h.horseCode})${h.isLocked ? " - Medical Lock 🔒" : ""}`,
                  }))}
                />
              </Field>

              <Field label="Target Race Distance (meters)" required>
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

            <Field label="Core Conditioning Objective" required>
              <Textarea
                rows={2}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="State the core objective, e.g., Build aerobic capacity and race-pace rhythm..."
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Start Date" required>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Field label="Target End Date" required>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
            </div>

            <Field label="Trainer Notes & Tactical Considerations">
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Track surface preferences, nutritional requirements, or special jockey instructions..."
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <Button tone="primary" onClick={() => setStep(2)}>
                Next: Phase Schedule →
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
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Phase #{idx + 1}</h3>
                  {phases.length > 1 && (
                    <Button tone="danger" onClick={() => handleRemovePhase(idx)}>
                      Remove Phase
                    </Button>
                  )}
                </div>

                <Field label="Phase Title" required>
                  <Input
                    value={ph.name}
                    onChange={(e) => handlePhaseChange(idx, "name", e.target.value)}
                    placeholder="e.g. Phase 1: Aerobic Base & Stamina..."
                  />
                </Field>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Field label="Max Target Heart Rate (bpm)">
                    <Input
                      type="number"
                      value={ph.targetHeartRateMax}
                      onChange={(e) => handlePhaseChange(idx, "targetHeartRateMax", Number(e.target.value))}
                    />
                  </Field>

                  <Field label="Target Speed (km/h)">
                    <Input
                      type="number"
                      value={ph.targetSpeedKmh}
                      onChange={(e) => handlePhaseChange(idx, "targetSpeedKmh", Number(e.target.value))}
                    />
                  </Field>
                </div>

                <Field label="Workout Focus in this Phase">
                  <Textarea
                    rows={2}
                    value={ph.focus}
                    onChange={(e) => handlePhaseChange(idx, "focus", e.target.value)}
                    placeholder="e.g. Long-distance steady canter, uphill conditioning..."
                  />
                </Field>
              </div>
            </Card>
          ))}

          <Button tone="secondary" onClick={handleAddPhase}>
            + Add New Phase
          </Button>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
            <Button tone="ghost" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button tone="primary" onClick={() => setStep(3)}>
              Next: Health Review & Finalize →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <Card pad={24}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>Review & Medical Clearance Verification</h3>
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
                  🔒 MEDICAL LOCK ACTIVE
                </div>
                <div style={{ fontSize: "0.875rem" }}>
                  Horse <strong>{selectedHorse?.name}</strong> is currently under Veterinary Medical Lock:
                  <div style={{ marginTop: "0.25rem", fontStyle: "italic" }}>
                    &ldquo;{selectedHorse?.lockReason || "Under protective clinical training suspension"}&rdquo;
                  </div>
                  <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                    <li>You are strictly prohibited from activating this plan to ACTIVE status.</li>
                    <li>You may only <strong>Save as Draft</strong> until the Veterinarian removes the lock.</li>
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
                  ✓ Medical Clearance Confirmed: No active veterinary training suspensions found for {selectedHorse?.name}.
                </div>
              </div>
            )}

            <div style={{ background: "var(--surface-sunken)", padding: "1rem", borderRadius: 8, fontSize: "0.875rem" }}>
              <div><strong>Plan Name:</strong> {name || "Untitled"}</div>
              <div><strong>Assigned Horse:</strong> {selectedHorse?.name} ({selectedHorse?.code || selectedHorse?.horseCode})</div>
              <div><strong>Target Distance:</strong> {targetDistance}m</div>
              <div><strong>Duration:</strong> {startDate} to {endDate}</div>
              <div><strong>Phases:</strong> {phases.length}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
              <Button tone="ghost" onClick={() => setStep(2)}>
                ← Back
              </Button>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <Button tone="secondary" onClick={() => void handleSave(false)} disabled={submitting}>
                  Save as Draft
                </Button>
                <Button
                  tone="primary"
                  onClick={() => void handleSave(true)}
                  disabled={submitting || isHorseLocked}
                >
                  Save & Activate Plan
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
