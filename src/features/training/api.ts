import { api } from "@/shared/lib/api";
import type {
  ExerciseSession,
  FitnessMetricPoint,
  SessionResult,
  TrainingAlert,
  TrainingPlan,
  TrialRunSchedule,
} from "./types";

const MOCK_PLANS: TrainingPlan[] = [
  {
    id: "plan-1",
    planCode: "PLAN-2026-001",
    name: "Endurance & Speed Conditioning - Autumn Derby",
    horseId: "horse-1",
    horseName: "Thunderbolt Swift",
    horseCode: "HR-000001",
    target: "Enhance muscular endurance and stabilize heart rate during 2000m sprint phase",
    targetDistanceMeters: 2000,
    startDate: "2026-09-15",
    endDate: "2026-10-31",
    status: "ACTIVE",
    headTrainerId: "trainer-1",
    headTrainerName: "David Nguyen (Head Trainer)",
    notes: "Focus on light aerobic intervals early in the week and progressive pacing on weekends",
    createdAt: "2026-09-10",
    updatedAt: "2026-09-28",
    phases: [
      {
        id: "phase-1",
        phaseOrder: 1,
        name: "Phase 1: Volume Building & Aerobic Base",
        startDate: "2026-09-15",
        endDate: "2026-09-30",
        targetHeartRateMax: 140,
        targetSpeedKmh: 35,
        focus: "Hill walks, steady trot, and extended canter at controlled pace",
      },
      {
        id: "phase-2",
        phaseOrder: 2,
        name: "Phase 2: Speed Work & Sprint Conditioning",
        startDate: "2026-10-01",
        endDate: "2026-10-20",
        targetHeartRateMax: 175,
        targetSpeedKmh: 58,
        focus: "Interval workouts and final 400m acceleration runs",
      },
      {
        id: "phase-3",
        phaseOrder: 3,
        name: "Phase 3: Tapering & Gate Rehearsal",
        startDate: "2026-10-21",
        endDate: "2026-10-31",
        targetHeartRateMax: 150,
        targetSpeedKmh: 45,
        focus: "Rhythm maintenance and barrier break reaction practice",
      },
    ],
  },
  {
    id: "plan-2",
    planCode: "PLAN-2026-002",
    name: "Post-Injury Gentle Recovery Protocol",
    horseId: "horse-2",
    horseName: "Northern Dancer Legacy",
    horseCode: "HR-000002",
    target: "Musculoskeletal rehabilitation and low cardiovascular strain capped below 120 bpm",
    targetDistanceMeters: 800,
    startDate: "2026-10-01",
    endDate: "2026-11-15",
    status: "DRAFT",
    headTrainerId: "trainer-1",
    headTrainerName: "David Nguyen (Head Trainer)",
    isLockedByMedical: true,
    notes: "Under active Medical Lock: High-intensity workouts (Gallop, Fast Canter) strictly suspended!",
    createdAt: "2026-09-29",
    updatedAt: "2026-09-29",
    phases: [
      {
        id: "phase-2-1",
        phaseOrder: 1,
        name: "Phase 1: Controlled Walk & Joint Mobilization",
        startDate: "2026-10-01",
        endDate: "2026-10-20",
        targetHeartRateMax: 110,
        targetSpeedKmh: 15,
        focus: "Hand walking 30 min/day and gentle equine hydrotherapy",
      },
    ],
  },
];

const MOCK_SESSIONS: ExerciseSession[] = [
  {
    id: "ses-101",
    planId: "plan-1",
    planName: "Endurance & Speed Conditioning - Autumn Derby",
    horseId: "horse-1",
    horseName: "Thunderbolt Swift",
    horseCode: "HR-000001",
    sessionDate: "2026-09-30",
    startTime: "06:30",
    endTime: "07:30",
    sessionType: "CANTER",
    intensity: "MODERATE",
    status: "COMPLETED",
    groomName: "John Smith (Groom Hand)",
    jockeyName: "Alex Turner (Jockey)",
    trackType: "TURF",
    lane: 2,
    targetDistanceMeters: 1600,
    notes: "Dry turf track conditions, light headwind",
    result: {
      id: "res-1",
      sessionId: "ses-101",
      actualDistanceMeters: 1620,
      actualDurationSeconds: 154,
      avgSpeedKmh: 37.8,
      maxSpeedKmh: 48.2,
      avgHeartRate: 138,
      maxHeartRate: 162,
      recoveryHeartRate1Min: 98,
      recoveryHeartRate5Min: 62,
      performanceScore: 8.5,
      hasAbnormalSigns: false,
      alertSentToVet: false,
      headTrainerFeedback: "Horse maintained steady rhythm with calm post-session respiration.",
      recordedAt: "2026-09-30 07:40",
      recordedBy: "David Nguyen (Head Trainer)",
    },
  },
  {
    id: "ses-102",
    planId: "plan-1",
    planName: "Endurance & Speed Conditioning - Autumn Derby",
    horseId: "horse-1",
    horseName: "Thunderbolt Swift",
    horseCode: "HR-000001",
    sessionDate: "2026-10-01",
    startTime: "06:00",
    endTime: "07:15",
    sessionType: "GALLOP",
    intensity: "HEAVY",
    status: "SCHEDULED",
    groomName: "John Smith (Groom Hand)",
    jockeyName: "Alex Turner (Jockey)",
    trackType: "TURF",
    lane: 1,
    targetDistanceMeters: 1800,
    notes: "Focus on final 400m speed acceleration",
  },
  {
    id: "ses-103",
    planId: "plan-2",
    planName: "Post-Injury Gentle Recovery Protocol",
    horseId: "horse-2",
    horseName: "Northern Dancer Legacy",
    horseCode: "HR-000002",
    sessionDate: "2026-10-01",
    startTime: "08:00",
    endTime: "08:45",
    sessionType: "CANTER",
    intensity: "HEAVY",
    status: "BLOCKED_BY_LOCK",
    blockedReason: "Medical Lock Active: Acute suspensory ligament strain. Heavy training strictly prohibited!",
    groomName: "John Smith (Groom Hand)",
    targetDistanceMeters: 1200,
    notes: "Automatically blocked by system due to active Medical Lock",
  },
  {
    id: "ses-104",
    horseId: "horse-2",
    horseName: "Northern Dancer Legacy",
    horseCode: "HR-000002",
    sessionDate: "2026-10-01",
    startTime: "16:00",
    endTime: "16:30",
    sessionType: "WALK",
    intensity: "LIGHT",
    status: "SCHEDULED",
    groomName: "John Smith (Groom Hand)",
    targetDistanceMeters: 600,
    notes: "Gentle soft-ground walking for joint rehabilitation; compliant with Vet protocol",
  },
];

const MOCK_TRIAL_RUNS: TrialRunSchedule[] = [
  {
    id: "trial-1",
    runCode: "TR-2026-W40-01",
    runDate: "2026-10-03",
    trackType: "TURF",
    orderNumber: 1,
    distanceMeters: 1200,
    startTime: "07:00",
    status: "PENDING",
    coordinatorName: "David Nguyen (Head Trainer)",
    notes: "Barrier break trial in preparation for Autumn Cup",
    horses: [
      { horseId: "horse-1", horseName: "Thunderbolt Swift", jockeyName: "Alex Turner", gateNumber: 1 },
      { horseId: "horse-3", horseName: "Shadowfax Wonder", jockeyName: "Kyle Bennett", gateNumber: 2 },
    ],
  },
  {
    id: "trial-2",
    runCode: "TR-2026-W40-02",
    runDate: "2026-10-03",
    trackType: "SAND",
    orderNumber: 2,
    distanceMeters: 1400,
    startTime: "07:45",
    status: "PENDING",
    coordinatorName: "David Nguyen (Head Trainer)",
    notes: "Sand track trial for surface adaptation and conditioning",
    horses: [
      { horseId: "horse-1", horseName: "Thunderbolt Swift", jockeyName: "Alex Turner", gateNumber: 1 },
      { horseId: "horse-3", horseName: "Shadowfax Wonder", jockeyName: "Kyle Bennett", gateNumber: 2 },
    ],
  },
];

const MOCK_FITNESS_METRICS: FitnessMetricPoint[] = [
  { date: "2026-09-16", sessionName: "Basic Trot", avgSpeedKmh: 24, maxSpeedKmh: 32, avgHeartRate: 110, maxHeartRate: 135, recoveryScore: 88, staminaScore: 72, performanceScore: 7.0, hasAlert: false },
  { date: "2026-09-19", sessionName: "Canter 1200m", avgSpeedKmh: 32, maxSpeedKmh: 42, avgHeartRate: 125, maxHeartRate: 148, recoveryScore: 84, staminaScore: 75, performanceScore: 7.5, hasAlert: false },
  { date: "2026-09-22", sessionName: "Canter 1600m", avgSpeedKmh: 35, maxSpeedKmh: 46, avgHeartRate: 130, maxHeartRate: 154, recoveryScore: 82, staminaScore: 78, performanceScore: 8.0, hasAlert: false },
  { date: "2026-09-26", sessionName: "Interval Sprints", avgSpeedKmh: 38, maxSpeedKmh: 52, avgHeartRate: 142, maxHeartRate: 170, recoveryScore: 79, staminaScore: 82, performanceScore: 8.2, hasAlert: false },
  { date: "2026-09-30", sessionName: "High-speed Canter", avgSpeedKmh: 37.8, maxSpeedKmh: 48.2, avgHeartRate: 138, maxHeartRate: 162, recoveryScore: 86, staminaScore: 85, performanceScore: 8.5, hasAlert: false },
];

const MOCK_ALERTS: TrainingAlert[] = [
  {
    id: "alt-1",
    horseId: "horse-2",
    horseName: "Northern Dancer Legacy",
    sessionId: "ses-99",
    sessionDate: "2026-09-28",
    severity: "HIGH",
    alertType: "LAMENESS_OBSERVED",
    message: "Groom reported limping after light trot, left forelimb pain response.",
    reportedBy: "John Smith (Groom Hand)",
    createdAt: "2026-09-28 08:15",
    acknowledgedByVet: true,
    vetNotes: "Examined and diagnosed with superficial digital flexor desmitis. Medical Lock placed.",
  },
  {
    id: "alt-2",
    horseId: "horse-3",
    horseName: "Shadowfax Wonder",
    sessionId: "ses-100",
    sessionDate: "2026-09-29",
    severity: "MEDIUM",
    alertType: "HEART_RATE_SPIKE",
    message: "Delayed heart rate recovery (115 bpm after 5 minutes of rest).",
    reportedBy: "Kyle Bennett (Jockey)",
    createdAt: "2026-09-29 07:35",
    acknowledgedByVet: false,
  },
];

const TRAINING_PLANS_KEY = "equiflow.training.plans.v1";

function getStoredPlans(): TrainingPlan[] {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(TRAINING_PLANS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TrainingPlan[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
  }
  return MOCK_PLANS;
}

function saveStoredPlans(plans: TrainingPlan[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(TRAINING_PLANS_KEY, JSON.stringify(plans));
    } catch {
      // ignore
    }
  }
}

export const trainingApi = {
  // Plans
  async getPlans(): Promise<TrainingPlan[]> {
    try {
      const res = await api<TrainingPlan[]>("GET", "/training/plans");
      if (Array.isArray(res) && res.length > 0) return res;
      return structuredClone(getStoredPlans());
    } catch {
      return structuredClone(getStoredPlans());
    }
  },

  async getPlanById(id: string): Promise<TrainingPlan | null> {
    try {
      const res = await api<TrainingPlan>("GET", `/training/plans/${id}`);
      if (res) return res;
    } catch {
      // fallback to mock
    }
    const plans = getStoredPlans();
    const p = plans.find((item) => item.id === id);
    return p ? structuredClone(p) : null;
  },

  async createPlan(data: Partial<TrainingPlan>): Promise<TrainingPlan> {
    const plans = getStoredPlans();
    const newPlan: TrainingPlan = {
      id: `plan-${Date.now()}`,
      planCode: `PLAN-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: data.name || "New Training Plan",
      horseId: data.horseId || "horse-1",
      horseName: data.horseName || "Thunderbolt Swift",
      horseCode: data.horseCode || "HR-000001",
      target: data.target || "",
      targetDistanceMeters: data.targetDistanceMeters || 1600,
      startDate: data.startDate || new Date().toISOString().split("T")[0],
      endDate: data.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: data.status || "DRAFT",
      phases: data.phases || [],
      headTrainerId: "trainer-1",
      headTrainerName: "David Nguyen (Head Trainer)",
      notes: data.notes || "",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    plans.unshift(newPlan);
    saveStoredPlans(plans);
    return structuredClone(newPlan);
  },

  async activatePlan(id: string): Promise<TrainingPlan> {
    const plans = getStoredPlans();
    const p = plans.find((item) => item.id === id);
    if (!p) throw new Error("Training plan not found");
    if (p.isLockedByMedical) {
      throw new Error("Cannot activate plan: Horse is currently under protective Medical Lock!");
    }
    p.status = "ACTIVE";
    p.updatedAt = new Date().toISOString().split("T")[0];
    saveStoredPlans(plans);
    return structuredClone(p);
  },

  async cancelPlan(id: string, reason: string): Promise<TrainingPlan> {
    const plans = getStoredPlans();
    const p = plans.find((item) => item.id === id);
    if (!p) throw new Error("Training plan not found");
    p.status = "CANCELLED";
    p.cancelledReason = reason;
    p.updatedAt = new Date().toISOString().split("T")[0];
    saveStoredPlans(plans);
    return structuredClone(p);
  },

  async completePlan(id: string): Promise<TrainingPlan> {
    const plans = getStoredPlans();
    const p = plans.find((item) => item.id === id);
    if (!p) throw new Error("Training plan not found");
    p.status = "COMPLETED";
    p.completedAt = new Date().toISOString().split("T")[0];
    p.updatedAt = new Date().toISOString().split("T")[0];
    saveStoredPlans(plans);
    return structuredClone(p);
  },

  async clonePlan(id: string, targetHorseId: string, targetHorseName: string): Promise<TrainingPlan> {
    const plans = getStoredPlans();
    const source = plans.find((item) => item.id === id);
    if (!source) throw new Error("Original training plan not found");
    const cloned: TrainingPlan = {
      ...structuredClone(source),
      id: `plan-${Date.now()}`,
      planCode: `PLAN-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: `${source.name} (Copy)`,
      horseId: targetHorseId,
      horseName: targetHorseName,
      status: "DRAFT",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    plans.unshift(cloned);
    saveStoredPlans(plans);
    return structuredClone(cloned);
  },

  // Sessions
  async getSessions(filter?: { date?: string; horseId?: string }): Promise<ExerciseSession[]> {
    let result = [...MOCK_SESSIONS];
    if (filter?.date) {
      result = result.filter((s) => s.sessionDate === filter.date);
    }
    if (filter?.horseId) {
      result = result.filter((s) => s.horseId === filter.horseId);
    }
    return structuredClone(result);
  },

  async createSession(session: Partial<ExerciseSession>): Promise<ExerciseSession> {
    const isLocked = session.horseId === "horse-2"; // Mock check
    const isHeavy = session.intensity === "HEAVY" || session.sessionType === "CANTER" || session.sessionType === "GALLOP";

    const newSession: ExerciseSession = {
      id: `ses-${Date.now()}`,
      planId: session.planId,
      horseId: session.horseId || "horse-1",
      horseName: session.horseName || "Thunderbolt Swift",
      sessionDate: session.sessionDate || new Date().toISOString().split("T")[0],
      startTime: session.startTime || "07:00",
      endTime: session.endTime || "08:00",
      sessionType: session.sessionType || "TROT",
      intensity: session.intensity || "MODERATE",
      status: isLocked && isHeavy ? "BLOCKED_BY_LOCK" : "SCHEDULED",
      blockedReason: isLocked && isHeavy ? "Medical Lock Active: Heavy workouts automatically blocked by system!" : undefined,
      groomName: session.groomName,
      jockeyName: session.jockeyName,
      trackType: session.trackType || "TURF",
      lane: session.lane || 1,
      targetDistanceMeters: session.targetDistanceMeters || 1200,
      notes: session.notes,
    };
    MOCK_SESSIONS.push(newSession);
    return structuredClone(newSession);
  },

  async restoreBlockedSession(sessionId: string): Promise<ExerciseSession> {
    const s = MOCK_SESSIONS.find((item) => item.id === sessionId);
    if (!s) throw new Error("Workout session not found");
    s.status = "SCHEDULED";
    s.blockedReason = undefined;
    return structuredClone(s);
  },

  async saveSessionResult(sessionId: string, resultData: Partial<SessionResult>): Promise<SessionResult> {
    const s = MOCK_SESSIONS.find((item) => item.id === sessionId);
    if (!s) throw new Error("Workout session not found");

    const result: SessionResult = {
      id: `res-${Date.now()}`,
      sessionId,
      actualDistanceMeters: resultData.actualDistanceMeters || 1200,
      actualDurationSeconds: resultData.actualDurationSeconds || 120,
      avgSpeedKmh: resultData.avgSpeedKmh || 36,
      maxSpeedKmh: resultData.maxSpeedKmh || 45,
      avgHeartRate: resultData.avgHeartRate || 130,
      maxHeartRate: resultData.maxHeartRate || 155,
      recoveryHeartRate1Min: resultData.recoveryHeartRate1Min,
      recoveryHeartRate5Min: resultData.recoveryHeartRate5Min,
      performanceScore: resultData.performanceScore || 8,
      hasAbnormalSigns: Boolean(resultData.hasAbnormalSigns),
      abnormalSignsDescription: resultData.abnormalSignsDescription,
      alertSentToVet: Boolean(resultData.hasAbnormalSigns),
      headTrainerFeedback: resultData.headTrainerFeedback,
      recordedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      recordedBy: "David Nguyen (Head Trainer)",
    };

    s.result = result;
    s.status = "COMPLETED";

    // If abnormal signs detected, trigger alert to VET
    if (result.hasAbnormalSigns) {
      MOCK_ALERTS.unshift({
        id: `alt-${Date.now()}`,
        horseId: s.horseId,
        horseName: s.horseName,
        sessionId: s.id,
        sessionDate: s.sessionDate,
        severity: "HIGH",
        alertType: "LAMENESS_OBSERVED",
        message: result.abnormalSignsDescription || "Abnormal clinical symptoms observed post-workout",
        reportedBy: "David Nguyen (Head Trainer)",
        createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        acknowledgedByVet: false,
      });
    }

    return structuredClone(result);
  },


  // Trial Runs
  async getTrialRuns(): Promise<TrialRunSchedule[]> {
    return structuredClone(MOCK_TRIAL_RUNS);
  },

  async createTrialRun(data: Partial<TrialRunSchedule>): Promise<TrialRunSchedule> {
    const item: TrialRunSchedule = {
      id: `trial-${Date.now()}`,
      runCode: `CT-2026-W${Math.floor(35 + Math.random() * 15)}-${Math.floor(1 + Math.random() * 9)}`,
      runDate: data.runDate || new Date().toISOString().split("T")[0],
      trackType: data.trackType || "TURF",
      orderNumber: MOCK_TRIAL_RUNS.length + 1,
      distanceMeters: data.distanceMeters || 1200,
      startTime: data.startTime || "07:00",
      status: "PENDING",
      horses: data.horses || [],
      coordinatorName: "David Nguyen (Head Trainer)",
      notes: data.notes || "",
    };
    MOCK_TRIAL_RUNS.push(item);
    return structuredClone(item);
  },

  // Fitness Metrics & Alerts
  async getFitnessMetrics(horseId: string): Promise<FitnessMetricPoint[]> {
    void horseId;
    return structuredClone(MOCK_FITNESS_METRICS);
  },

  async getAlerts(): Promise<TrainingAlert[]> {
    return structuredClone(MOCK_ALERTS);
  },

  async acknowledgeAlert(alertId: string, vetNotes: string): Promise<TrainingAlert> {
    const alert = MOCK_ALERTS.find((a) => a.id === alertId);
    if (!alert) throw new Error("Training alert not found");
    alert.acknowledgedByVet = true;
    alert.vetNotes = vetNotes;
    return structuredClone(alert);
  },
};
