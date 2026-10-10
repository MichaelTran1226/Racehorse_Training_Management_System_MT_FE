import type {
  ExerciseSession,
  FitnessMetricPoint,
  TrainingAlert,
  TrainingPlan,
  TrialRunSchedule,
} from "@/features/training/types";

const PLANS_STORAGE_KEY = "equiflow.training.plans.v2";
const WORKOUTS_STORAGE_KEY = "equiflow.training.workouts.v2";
const TRIAL_RUNS_STORAGE_KEY = "equiflow.training.trial_runs.v2";
const ALERTS_STORAGE_KEY = "equiflow.training.alerts.v2";

const INITIAL_MOCK_PLANS: TrainingPlan[] = [
  {
    id: "plan-1",
    planCode: "PLAN-2026-001",
    name: "Endurance & Speed Conditioning - Autumn Derby",
    horseId: "horse-1",
    horseName: "Thunderbolt Swift",
    horseCode: "HR-000001",
    target: "Enhance muscular stamina and stabilize cardiac recovery for 2000m distance races",
    targetDistanceMeters: 2000,
    startDate: "2026-09-15",
    endDate: "2026-10-31",
    status: "ACTIVE",
    headTrainerId: "trainer-1",
    headTrainerName: "David Nguyen (Head Trainer)",
    notes: "Focus on aerobic foundation early in the week and sprint tempo closer to weekend",
    createdAt: "2026-09-10",
    updatedAt: "2026-09-28",
    phases: [
      {
        id: "phase-1",
        phaseOrder: 1,
        name: "Phase 1: Volume Acclimatization & Aerobic Base",
        startDate: "2026-09-15",
        endDate: "2026-09-30",
        targetHeartRateMax: 140,
        targetSpeedKmh: 35,
        focus: "Hill walking, steady trotting, and long-distance canter at controlled pace",
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
    target: "Rehabilitate flexor tendon, joint mobility, keep cardiac exertion below 120 bpm",
    targetDistanceMeters: 800,
    startDate: "2026-10-01",
    endDate: "2026-11-15",
    status: "DRAFT",
    headTrainerId: "trainer-1",
    headTrainerName: "David Nguyen (Head Trainer)",
    isLockedByMedical: true,
    notes: "Active Medical Lock: Acute suspensory ligament strain. Heavy training strictly prohibited!",
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

const INITIAL_MOCK_WORKOUTS: ExerciseSession[] = [
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

const INITIAL_MOCK_TRIAL_RUNS: TrialRunSchedule[] = [
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

const INITIAL_MOCK_ALERTS: TrainingAlert[] = [
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
    message: "Heart rate exceeded 190 bpm during routine 1200m conditioning canter.",
    reportedBy: "Alex Turner (Jockey)",
    createdAt: "2026-09-29 09:30",
    acknowledgedByVet: false,
  },
];

export function getStoredPlans(): TrainingPlan[] {
  if (typeof window === "undefined") return INITIAL_MOCK_PLANS;
  try {
    const raw = localStorage.getItem(PLANS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  saveStoredPlans(INITIAL_MOCK_PLANS);
  return INITIAL_MOCK_PLANS;
}

export function saveStoredPlans(plans: TrainingPlan[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans));
    } catch {}
  }
}

export function getStoredWorkouts(): ExerciseSession[] {
  if (typeof window === "undefined") return INITIAL_MOCK_WORKOUTS;
  try {
    const raw = localStorage.getItem(WORKOUTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  saveStoredWorkouts(INITIAL_MOCK_WORKOUTS);
  return INITIAL_MOCK_WORKOUTS;
}

export function saveStoredWorkouts(workouts: ExerciseSession[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(workouts));
    } catch {}
  }
}

export function getStoredTrialRuns(): TrialRunSchedule[] {
  if (typeof window === "undefined") return INITIAL_MOCK_TRIAL_RUNS;
  try {
    const raw = localStorage.getItem(TRIAL_RUNS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  saveStoredTrialRuns(INITIAL_MOCK_TRIAL_RUNS);
  return INITIAL_MOCK_TRIAL_RUNS;
}

export function saveStoredTrialRuns(trials: TrialRunSchedule[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(TRIAL_RUNS_STORAGE_KEY, JSON.stringify(trials));
    } catch {}
  }
}

export function getStoredAlerts(): TrainingAlert[] {
  if (typeof window === "undefined") return INITIAL_MOCK_ALERTS;
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  saveStoredAlerts(INITIAL_MOCK_ALERTS);
  return INITIAL_MOCK_ALERTS;
}

export function saveStoredAlerts(alerts: TrainingAlert[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    } catch {}
  }
}

export function getStoredFitnessMetrics(horseId: string): FitnessMetricPoint[] {
  const isHorse2 = horseId === "horse-2";
  return [
    {
      date: "2026-09-16",
      sessionName: "Basic Trot",
      avgSpeedKmh: isHorse2 ? 18 : 24,
      maxSpeedKmh: isHorse2 ? 22 : 32,
      avgHeartRate: isHorse2 ? 105 : 110,
      maxHeartRate: isHorse2 ? 120 : 135,
      recoveryScore: isHorse2 ? 75 : 88,
      staminaScore: isHorse2 ? 60 : 72,
      performanceScore: isHorse2 ? 6.0 : 7.0,
      hasAlert: false,
    },
    {
      date: "2026-09-19",
      sessionName: "Canter 1200m",
      avgSpeedKmh: isHorse2 ? 22 : 32,
      maxSpeedKmh: isHorse2 ? 28 : 42,
      avgHeartRate: isHorse2 ? 115 : 125,
      maxHeartRate: isHorse2 ? 130 : 148,
      recoveryScore: isHorse2 ? 72 : 84,
      staminaScore: isHorse2 ? 62 : 75,
      performanceScore: isHorse2 ? 6.2 : 7.5,
      hasAlert: false,
    },
    {
      date: "2026-09-22",
      sessionName: "Canter 1600m",
      avgSpeedKmh: isHorse2 ? 24 : 35,
      maxSpeedKmh: isHorse2 ? 30 : 46,
      avgHeartRate: isHorse2 ? 118 : 130,
      maxHeartRate: isHorse2 ? 134 : 154,
      recoveryScore: isHorse2 ? 70 : 82,
      staminaScore: isHorse2 ? 64 : 78,
      performanceScore: isHorse2 ? 6.5 : 8.0,
      hasAlert: false,
    },
    {
      date: "2026-09-26",
      sessionName: "Interval Sprints",
      avgSpeedKmh: isHorse2 ? 26 : 38,
      maxSpeedKmh: isHorse2 ? 34 : 52,
      avgHeartRate: isHorse2 ? 135 : 142,
      maxHeartRate: isHorse2 ? 160 : 170,
      recoveryScore: isHorse2 ? 65 : 79,
      staminaScore: isHorse2 ? 65 : 82,
      performanceScore: isHorse2 ? 6.8 : 8.2,
      hasAlert: false,
    },
    {
      date: "2026-09-30",
      sessionName: "High-speed Canter",
      avgSpeedKmh: isHorse2 ? 28 : 37.8,
      maxSpeedKmh: isHorse2 ? 36 : 48.2,
      avgHeartRate: isHorse2 ? 140 : 138,
      maxHeartRate: isHorse2 ? 165 : 162,
      recoveryScore: isHorse2 ? 62 : 86,
      staminaScore: isHorse2 ? 66 : 85,
      performanceScore: isHorse2 ? 7.0 : 8.5,
      hasAlert: isHorse2,
    },
  ];
}
