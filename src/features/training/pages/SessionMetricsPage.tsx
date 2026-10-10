import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Tabs } from "@/shared/components/ui/Tabs";
import { Textarea } from "@/shared/components/form/Textarea";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { getHorses } from "@/features/horses/api";
import { trainingApi } from "../api";
import type { ExerciseSession, FitnessMetricPoint } from "../types";

export default function SessionMetricsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isTrainer = user?.role === "HEAD_TRAINER" || user?.role === "CLUB_MANAGER";

  const [activeTab, setActiveTab] = useState<string>("RECORD");
  const [metrics, setMetrics] = useState<FitnessMetricPoint[]>([]);
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [horseOptions, setHorseOptions] = useState<{ value: string; label: string }[]>([
    { value: "horse-1", label: "Thunderbolt Swift (HR-000001)" },
    { value: "horse-2", label: "Northern Dancer Legacy (HR-000002)" },
    { value: "horse-3", label: "Shadowfax Wonder (HR-000003)" },
  ]);
  const [selectedHorseId, setSelectedHorseId] = useState<string>("horse-1");
  const [loading, setLoading] = useState<boolean>(true);

  // Form Record Session Result (SC-2.06)
  const [selectedSessionId, setSelectedSessionId] = useState<string>("ses-102");
  const [actualDistance, setActualDistance] = useState<number>(1800);
  const [actualDuration, setActualDuration] = useState<number>(168);
  const [avgSpeed, setAvgSpeed] = useState<number>(38.5);
  const [maxSpeed, setMaxSpeed] = useState<number>(51.2);
  const [avgHeartRate, setAvgHeartRate] = useState<number>(142);
  const [maxHeartRate, setMaxHeartRate] = useState<number>(172);
  const [rec1Min, setRec1Min] = useState<number>(102);
  const [rec5Min, setRec5Min] = useState<number>(68);
  const [performanceScore, setPerformanceScore] = useState<number>(8.5);
  const [hasAbnormal, setHasAbnormal] = useState<boolean>(false);
  const [abnormalDesc, setAbnormalDesc] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    getHorses({ limit: 50 })
      .then((res) => {
        if (res.items && res.items.length > 0) {
          const opts = res.items.map((h) => ({
            value: h.id,
            label: `${h.name} (${h.horseCode || h.id.slice(0, 8)})`,
          }));
          setHorseOptions(opts);
        }
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [data, sessionList] = await Promise.all([
        trainingApi.getFitnessMetrics(selectedHorseId),
        trainingApi.getSessions({ horseId: selectedHorseId }),
      ]);
      setMetrics(data);
      setSessions(sessionList);
      if (sessionList.length > 0) {
        setSelectedSessionId(sessionList[0].id);
        if (sessionList[0].targetDistanceMeters) setActualDistance(sessionList[0].targetDistanceMeters);
      }
    } catch {
      toast.show("Unable to load fitness metrics data", "danger");
    } finally {
      setLoading(false);
    }
  }, [selectedHorseId, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmitResult = async () => {
    try {
      setSubmitting(true);
      await trainingApi.saveSessionResult(selectedSessionId, {
        actualDistanceMeters: actualDistance,
        actualDurationSeconds: actualDuration,
        avgSpeedKmh: avgSpeed,
        maxSpeedKmh: maxSpeed,
        avgHeartRate,
        maxHeartRate,
        recoveryHeartRate1Min: rec1Min,
        recoveryHeartRate5Min: rec5Min,
        performanceScore,
        hasAbnormalSigns: hasAbnormal,
        abnormalSignsDescription: abnormalDesc,
        headTrainerFeedback: feedback,
      });

      if (hasAbnormal) {
        toast.show(
          "Result saved & AUTOMATIC MEDICAL ALERT SENT TO VETERINARIAN (Flow 3)!",
          "danger",
        );
      } else {
        toast.show("Workout session results recorded successfully", "ok");
      }

      void loadData();
      setActiveTab("CHART");
    } catch {
      toast.show("Error saving workout session results", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Workout Metrics & Fitness Telemetry</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Record workout indicators, rate form, trigger veterinary alerts, and monitor recovery progress
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/training/alerts">
            <Button tone="secondary">Veterinary Clinical Alerts</Button>
          </Link>
          <Link to="/training/calendar">
            <Button tone="ghost">← Schedule</Button>
          </Link>
        </div>
      </div>

      {/* Athlete Horse Filter */}
      <Card pad={16}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 260 }}>
            <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Athlete Horse Profile:</span>
            <div style={{ minWidth: 240, flex: 1 }}>
              <Select
                value={selectedHorseId}
                onChange={(e) => setSelectedHorseId(e.target.value)}
                options={horseOptions}
              />
            </div>
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--ink-muted, #64748b)" }}>
            Showing telemetry stream & scheduled sessions for selected horse
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card pad={16}>
        <Tabs
          items={[
            { id: "RECORD", label: "Record Session Result" },
            { id: "CHART", label: "Fitness Trend Metrics" },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </Card>

      {/* TAB 1: Ghi nhận kết quả */}
      {activeTab === "RECORD" && (
        <Card pad={24}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>Log Post-Workout Exercise Metrics</h3>

            <Field label="Target Workout Session" required>
              <Select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                options={
                  sessions.length > 0
                    ? sessions.map((s) => ({
                        value: s.id,
                        label: `${s.sessionDate || "Today"} (${s.startTime || "07:00"}) - ${s.sessionType} ${s.targetDistanceMeters || 1200}m [Status: ${s.status}]`,
                      }))
                    : [
                        { value: "ses-102", label: "06:00 - 07:15: Thunderbolt Swift - Gallop Turf 1800m" },
                        { value: "ses-104", label: "16:00 - 16:30: Northern Dancer Legacy - Walk 600m" },
                      ]
                }
              />
            </Field>

            {/* Velocity and Distance */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <Field label="Actual Distance (meters)" required>
                <Input
                  type="number"
                  value={actualDistance}
                  onChange={(e) => setActualDistance(Number(e.target.value))}
                />
              </Field>

              <Field label="Duration (seconds)" required>
                <Input
                  type="number"
                  value={actualDuration}
                  onChange={(e) => setActualDuration(Number(e.target.value))}
                />
              </Field>

              <Field label="Avg Speed (km/h)" required>
                <Input
                  type="number"
                  step="0.1"
                  value={avgSpeed}
                  onChange={(e) => setAvgSpeed(Number(e.target.value))}
                />
              </Field>

              <Field label="Max Speed (km/h)" required>
                <Input
                  type="number"
                  step="0.1"
                  value={maxSpeed}
                  onChange={(e) => setMaxSpeed(Number(e.target.value))}
                />
              </Field>
            </div>

            {/* Heart rate telemetry */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <Field label="Avg Heart Rate (bpm)" required>
                <Input
                  type="number"
                  value={avgHeartRate}
                  onChange={(e) => setAvgHeartRate(Number(e.target.value))}
                />
              </Field>

              <Field label="Peak Heart Rate (bpm)" required>
                <Input
                  type="number"
                  value={maxHeartRate}
                  onChange={(e) => setMaxHeartRate(Number(e.target.value))}
                />
              </Field>

              <Field label="Heart Rate 1-min Recovery (bpm)">
                <Input
                  type="number"
                  value={rec1Min}
                  onChange={(e) => setRec1Min(Number(e.target.value))}
                />
              </Field>

              <Field label="Heart Rate 5-min Recovery (bpm)">
                <Input
                  type="number"
                  value={rec5Min}
                  onChange={(e) => setRec5Min(Number(e.target.value))}
                />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "1rem", alignItems: "flex-start" }}>
              <Field label="Performance Score (1 - 10)" required hint="Form, rhythm & cadence">
                <Input
                  type="number"
                  step="0.5"
                  min={1}
                  max={10}
                  value={performanceScore}
                  onChange={(e) => setPerformanceScore(Number(e.target.value))}
                />
              </Field>

              <Field label="Head Trainer Evaluation & Feedback">
                <Textarea
                  rows={2}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Gait rhythm analysis, stride observations, rider feedback..."
                />
              </Field>
            </div>

            {/* Abnormal signs checkbox -> Triggers Flow 3 Alert */}
            <div
              style={{
                padding: "1rem",
                borderRadius: 8,
                background: hasAbnormal ? "rgba(239, 68, 68, 0.08)" : "var(--surface-sunken)",
                border: hasAbnormal ? "1px solid var(--danger)" : "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <Checkbox
                label="Abnormal signs observed (lameness, shortness of breath, delayed cardiac recovery...)"
                checked={hasAbnormal}
                onChange={(checked) => setHasAbnormal(checked)}
              />

              {hasAbnormal && (
                <Field label="Detailed Clinical Description" required hint="This alert will automatically be dispatched to the Veterinarian for immediate clinical review">
                  <Textarea
                    rows={3}
                    value={abnormalDesc}
                    onChange={(e) => setAbnormalDesc(e.target.value)}
                    placeholder="e.g. Left forelimb reluctance on turn, breathing elevated past 10 minutes..."
                  />
                </Field>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              {isTrainer && (
                <Button tone="primary" onClick={() => void handleSubmitResult()} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Session Result"}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* TAB 2: Biểu đồ thể lực */}
      {activeTab === "CHART" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Progress summary card */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Recent Peak Speed</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent)" }}>48.2 km/h</div>
              <div style={{ fontSize: "0.75rem", color: "var(--ok)", marginTop: "0.25rem" }}>↑ +2.2 km/h from prior week</div>
            </div>

            <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Peak Heart Rate</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--warn)" }}>162 bpm</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Within safe aerobic envelope &lt; 180 bpm</div>
            </div>

            <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Recovery Score</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--ok)" }}>86 / 100</div>
              <div style={{ fontSize: "0.75rem", color: "var(--ok)", marginTop: "0.25rem" }}>Rapid cardiac recovery (Optimal)</div>
            </div>

            <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Composite Conditioning Score</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--accent)" }}>85 / 100</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Cleared for 2000m distances</div>
            </div>
          </div>

          {/* Visual bar progression table */}
          <Card pad={24}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 700 }}>
              Recent 5 Workout Progression Logs
            </h3>

            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading metrics...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                      <th style={{ padding: "0.75rem 1rem" }}>Date</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Workout Session</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Avg / Max Speed</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Avg / Peak HR</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Recovery Score</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Performance Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{m.date}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{m.sessionName}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontWeight: 600 }}>{m.avgSpeedKmh}</span> / {m.maxSpeedKmh} km/h
                          </div>
                          {/* Speed bar visual */}
                          <div style={{ height: 4, width: 120, background: "var(--surface-sunken)", borderRadius: 2, marginTop: 4 }}>
                            <div style={{ height: "100%", width: `${(m.maxSpeedKmh / 60) * 100}%`, background: "var(--accent)", borderRadius: 2 }} />
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <div>{m.avgHeartRate} / <strong>{m.maxHeartRate} bpm</strong></div>
                          <div style={{ height: 4, width: 120, background: "var(--surface-sunken)", borderRadius: 2, marginTop: 4 }}>
                            <div style={{ height: "100%", width: `${(m.maxHeartRate / 200) * 100}%`, background: "var(--warn)", borderRadius: 2 }} />
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <Badge tone="ok">{m.recoveryScore} / 100</Badge>
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{ fontWeight: 700, color: "var(--accent)" }}>{m.performanceScore}/10</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
