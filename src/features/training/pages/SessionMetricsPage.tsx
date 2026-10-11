import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert } from "@/shared/components/ui/Alert";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Tabs } from "@/shared/components/ui/Tabs";
import { Textarea } from "@/shared/components/form/Textarea";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { messageFor } from "@/shared/lib/messages";
import { getHorses } from "@/features/horses/api";
import { clubParts, trainingApi } from "../api";
import { EXERCISE_TYPE_LABEL, SESSION_STATUS_LABEL } from "../types";
import type { ExerciseSession, FitnessMetricPoint } from "../types";

/** Ô số: chuỗi rỗng = không nhập. */
function num(v: string): number | undefined {
  return v.trim() === "" ? undefined : Number(v);
}

/** Buổi tập ghi được kết quả: đã tới giờ, Bỏ lỡ (BE kiểm hạn 7 ngày), hoặc đã hoàn thành (sửa trong 48 giờ). */
function recordable(s: ExerciseSession): boolean {
  if (s.status === "MISSED" || s.status === "COMPLETED") return true;
  return s.status === "SCHEDULED" && new Date(s.scheduledAt).getTime() <= Date.now();
}

/** SC-2.06 Ghi kết quả (HT) + SC-2.07 Biểu đồ thể lực (xem). */
export default function SessionMetricsPage() {
  const user = useCurrentUser();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const isTrainer = user.role === "HEAD_TRAINER";

  const [activeTab, setActiveTab] = useState(isTrainer ? "RECORD" : "CHART");
  const [horseOptions, setHorseOptions] = useState<{ value: string; label: string }[]>([]);
  const [horseId, setHorseId] = useState(searchParams.get("horse") ?? "");
  const [metrics, setMetrics] = useState<FitnessMetricPoint[]>([]);
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [sessionId, setSessionId] = useState(searchParams.get("session") ?? "");
  const [loading, setLoading] = useState(false);

  const [duration, setDuration] = useState("");
  const [avgSpeed, setAvgSpeed] = useState("");
  const [maxSpeed, setMaxSpeed] = useState("");
  const [peakHr, setPeakHr] = useState("");
  const [recoveryHr, setRecoveryHr] = useState("");
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [abnormal, setAbnormal] = useState(false);
  const [abnormalDesc, setAbnormalDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getHorses({ limit: 100 })
      .then((res) => {
        setHorseOptions(res.items.map((h) => ({ value: h.id, label: `${h.name} (${h.horseCode ?? ""})` })));
        setHorseId((current) => current || res.items[0]?.id || "");
      })
      .catch((err) => toast.show(messageFor(err), "danger"));
  }, [toast]);

  const latestRequest = useRef(0);
  const loadData = useCallback(async () => {
    if (!horseId) return;
    const requestId = ++latestRequest.current;
    setLoading(true);
    try {
      const [m, list] = await Promise.all([
        trainingApi.getFitnessMetrics(horseId),
        trainingApi.getSessions({ horseId }),
      ]);
      if (requestId !== latestRequest.current) return; // đã chọn ngựa khác trong lúc chờ
      setMetrics(m);
      const eligible = list.filter(recordable);
      setSessions(eligible);
      setSessionId((current) => (eligible.some((s) => s.id === current) ? current : eligible[0]?.id ?? ""));
    } catch (err) {
      toast.show(messageFor(err), "danger");
    } finally {
      setLoading(false);
    }
  }, [horseId, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Khi chọn buổi đã có kết quả -> đổ sẵn để sửa.
  const selected = sessions.find((s) => s.id === sessionId);
  useEffect(() => {
    const r = selected?.result;
    setDuration(r?.actualDurationSeconds?.toString() ?? "");
    setAvgSpeed(r?.avgSpeedKmh?.toString() ?? "");
    setMaxSpeed(r?.maxSpeedKmh?.toString() ?? "");
    setPeakHr(r?.maxHeartRate?.toString() ?? "");
    setRecoveryHr(r?.recoveryHeartRate?.toString() ?? "");
    setScore(r?.performanceScore?.toString() ?? "");
    setFeedback(r?.headTrainerFeedback ?? "");
    setAbnormal(Boolean(r?.hasAbnormalSigns));
    setAbnormalDesc(r?.abnormalSignsDescription ?? "");
  }, [selected]);

  const abnormalInvalid = abnormal && (abnormalDesc.trim().length < 10 || abnormalDesc.trim().length > 500);

  const handleSubmit = async () => {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      await trainingApi.saveSessionResult(sessionId, {
        actualTimeSeconds: num(duration),
        averageSpeedKmh: num(avgSpeed),
        topSpeedKmh: num(maxSpeed),
        heartRatePeak: num(peakHr),
        heartRateRecovery: num(recoveryHr),
        performanceScore: num(score),
        trainerNotes: feedback.trim() || undefined,
        abnormalSigns: abnormal,
        abnormalNotes: abnormal ? abnormalDesc.trim() : undefined,
      });
      toast.show(abnormal ? "Result saved. The Veterinarian has been alerted." : "Result saved.", abnormal ? "warn" : "ok");
      void loadData();
      setActiveTab("CHART");
    } catch (err) {
      toast.show(messageFor(err), "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const latest = metrics[metrics.length - 1];
  const peakSpeed = metrics.reduce<number | null>((m, p) => (p.maxSpeedKmh != null && (m == null || p.maxSpeedKmh > m) ? p.maxSpeedKmh : m), null);
  const scored = metrics.filter((m) => m.performanceScore != null);
  const avgScore = scored.length ? scored.reduce((sum, m) => sum + (m.performanceScore ?? 0), 0) / scored.length : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Workout Results & Fitness</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Record results after a workout. Abnormal signs alert the Veterinarian. Values are entered by hand.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {(user.role === "HEAD_TRAINER" || user.role === "VETERINARIAN") && (
            <Link to="/training/alerts"><Button tone="secondary">Abnormal-sign alerts</Button></Link>
          )}
          <Link to="/training/calendar"><Button tone="ghost">← Schedule</Button></Link>
        </div>
      </div>

      <Card pad={16}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600 }}>Horse:</span>
          <div style={{ minWidth: 260, flex: 1 }}>
            <Select value={horseId} onChange={(e) => setHorseId(e.target.value)} options={horseOptions} />
          </div>
        </div>
      </Card>

      <Card pad={16}>
        <Tabs
          items={[
            ...(isTrainer ? [{ id: "RECORD", label: "Record result" }] : []),
            { id: "CHART", label: "Fitness trend" },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </Card>

      {activeTab === "RECORD" && isTrainer && (
        <Card pad={24}>
          {sessions.length === 0 ? (
            <EmptyState
              title="No workout to record"
              description="Results can be recorded once a workout has started, for missed workouts within 7 days, or edited within 48 hours."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <Field label="Workout" required>
                <Select
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  options={sessions.map((s) => ({
                    value: s.id,
                    label: `${s.sessionDate} ${s.startTime} · ${EXERCISE_TYPE_LABEL[s.sessionType]} ${s.repetitions}×${s.targetDistanceMeters}m · ${SESSION_STATUS_LABEL[s.status]}`,
                  }))}
                />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                <Field label="Duration (s)"><Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} /></Field>
                <Field label="Avg speed (km/h)"><Input type="number" step={0.1} value={avgSpeed} onChange={(e) => setAvgSpeed(e.target.value)} /></Field>
                <Field label="Top speed (km/h)"><Input type="number" step={0.1} value={maxSpeed} onChange={(e) => setMaxSpeed(e.target.value)} /></Field>
                <Field label="Peak heart rate (bpm)"><Input type="number" value={peakHr} onChange={(e) => setPeakHr(e.target.value)} /></Field>
                <Field label="Recovery heart rate (bpm)"><Input type="number" value={recoveryHr} onChange={(e) => setRecoveryHr(e.target.value)} /></Field>
                <Field label="Performance score" hint="1 – 10">
                  <Input type="number" min={1} max={10} step={0.5} value={score} onChange={(e) => setScore(e.target.value)} />
                </Field>
              </div>
              <Field label="Trainer feedback">
                <Textarea rows={2} maxLength={2000} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
              </Field>
              <div style={{ padding: "1rem", borderRadius: 8, border: `1px solid ${abnormal ? "var(--danger)" : "var(--border)"}`, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Checkbox label="Abnormal signs observed (lameness, breathing, slow heart-rate recovery...)" checked={abnormal} onChange={setAbnormal} />
                {abnormal && (
                  <Field label="Describe the signs" required hint="10-500 characters. The Veterinarian is alerted.">
                    <Textarea rows={3} maxLength={500} value={abnormalDesc} onChange={(e) => setAbnormalDesc(e.target.value)} />
                  </Field>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button tone="primary" onClick={() => void handleSubmit()} disabled={submitting || !sessionId || abnormalInvalid}>
                  {submitting ? "Saving..." : "Save result"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === "CHART" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <Card pad={16}>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Completed workouts</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{metrics.length}</div>
            </Card>
            <Card pad={16}>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Best top speed</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{peakSpeed != null ? `${peakSpeed} km/h` : "—"}</div>
            </Card>
            <Card pad={16}>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Latest peak heart rate</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{latest?.maxHeartRate != null ? `${latest.maxHeartRate} bpm` : "—"}</div>
            </Card>
            {user.role !== "GROOM" && (
              <Card pad={16}>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Average performance</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{avgScore != null ? `${avgScore.toFixed(1)} / 10` : "—"}</div>
              </Card>
            )}
          </div>
          <Card pad={24}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
            ) : metrics.length === 0 ? (
              <EmptyState title="No completed workouts yet" description="The fitness trend appears after the first recorded result." />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                      <th style={{ padding: "0.75rem 1rem" }}>Date</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Workout</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Avg / top speed</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Peak HR</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Recovery</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => (
                      <tr key={m.workoutId} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{clubParts(m.date).date}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          {m.sessionName} {m.hasAlert && <Badge tone="danger">Abnormal signs</Badge>}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>{m.avgSpeedKmh ?? "—"} / {m.maxSpeedKmh ?? "—"} km/h</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{m.maxHeartRate ?? "—"} bpm</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{m.recoveryScore != null ? `${m.recoveryScore} / 100` : "—"}</td>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>{m.performanceScore != null ? `${m.performanceScore}/10` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          {metrics.some((m) => m.hasAlert) && (
            <Alert tone="warn" title="Abnormal signs recorded">Check the alert list for the Veterinarian's response.</Alert>
          )}
        </div>
      )}
    </div>
  );
}
