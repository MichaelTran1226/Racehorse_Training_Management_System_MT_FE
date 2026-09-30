export type PlanStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type SessionStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "BLOCKED_BY_LOCK";
export type ExerciseType = "WALK" | "TROT" | "CANTER" | "GALLOP" | "GATE_PRACTICE" | "TRIAL_RUN" | "RECOVERY";
export type ExerciseIntensity = "LIGHT" | "MODERATE" | "HEAVY";
export type TrackType = "TURF" | "SAND" | "ALL_WEATHER";

export interface TrainingPhase {
  id: string;
  phaseOrder: number;
  name: string;
  startDate: string;
  endDate: string;
  targetHeartRateMax: number;
  targetSpeedKmh: number;
  focus: string;
}

export interface TrainingPlan {
  id: string;
  planCode: string;
  name: string;
  horseId: string;
  horseName: string;
  horseCode: string;
  target: string;
  targetDistanceMeters: number;
  startDate: string;
  endDate: string;
  status: PlanStatus;
  phases: TrainingPhase[];
  headTrainerId: string;
  headTrainerName: string;
  notes?: string;
  cancelledReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  isLockedByMedical?: boolean;
}

export interface SessionResult {
  id: string;
  sessionId: string;
  actualDistanceMeters: number;
  actualDurationSeconds: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  avgHeartRate: number;
  maxHeartRate: number;
  recoveryHeartRate1Min?: number;
  recoveryHeartRate5Min?: number;
  performanceScore: number; // 1 - 10
  hasAbnormalSigns: boolean;
  abnormalSignsDescription?: string;
  alertSentToVet: boolean;
  headTrainerFeedback?: string;
  recordedAt: string;
  recordedBy: string;
}

export interface ExerciseSession {
  id: string;
  planId?: string;
  planName?: string;
  horseId: string;
  horseName: string;
  horseCode?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  sessionType: ExerciseType;
  intensity: ExerciseIntensity;
  status: SessionStatus;
  groomId?: string;
  groomName?: string;
  jockeyId?: string;
  jockeyName?: string;
  trackType?: TrackType;
  lane?: number;
  targetDistanceMeters?: number;
  notes?: string;
  blockedReason?: string;
  result?: SessionResult;
}

export interface TrialRunHorseEntry {
  horseId: string;
  horseName: string;
  jockeyName: string;
  gateNumber: number;
  timingSeconds?: number;
  rank?: number;
}

export interface TrialRunSchedule {
  id: string;
  runCode: string;
  runDate: string;
  trackType: TrackType;
  orderNumber: number;
  distanceMeters: number;
  startTime: string;
  status: "PENDING" | "RUNNING" | "FINISHED" | "CANCELLED";
  horses: TrialRunHorseEntry[];
  coordinatorName: string;
  notes?: string;
}

export interface FitnessMetricPoint {
  date: string;
  sessionName: string;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  avgHeartRate: number;
  maxHeartRate: number;
  recoveryScore: number; // Điểm hồi phục 1-100
  staminaScore: number; // 1-100
  performanceScore: number; // 1-10
  hasAlert: boolean;
}

export interface TrainingAlert {
  id: string;
  horseId: string;
  horseName: string;
  sessionId: string;
  sessionDate: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  alertType: "HEART_RATE_SPIKE" | "LAMENESS_OBSERVED" | "SUDDEN_FATIGUE" | "POST_WORKOUT_FEVER";
  message: string;
  reportedBy: string;
  createdAt: string;
  acknowledgedByVet?: boolean;
  vetNotes?: string;
}
