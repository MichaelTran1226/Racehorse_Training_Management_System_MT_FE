// Flow 2 – kiểu dữ liệu màn hình. api.ts chuyển dữ liệu BE (TrainingPlan / WorkoutSession) sang các kiểu này.
// Bộ trạng thái theo quyết định Q14 = A (Flow 2 §4.1, §4.2).

export type PlanStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type SessionStatus = "SCHEDULED" | "COMPLETED" | "BLOCKED" | "MISSED" | "CANCELLED";
export type ExerciseType = "WALK" | "TROT" | "CANTER" | "BREEZE" | "TRIAL" | "SWIM" | "TREADMILL";
export type ExerciseIntensity = "LIGHT" | "MEDIUM" | "HEAVY";
export type TrackType = "TURF" | "DIRT" | "SYNTHETIC" | "NONE";
export type CancelWorkoutReason = "WEATHER" | "TRACK_CONDITION" | "HORSE_HEALTH" | "PLAN_CHANGE" | "OTHER";

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  BLOCKED: "Blocked – Medical Lock",
  MISSED: "Missed",
  CANCELLED: "Cancelled",
};

export const EXERCISE_TYPE_LABEL: Record<ExerciseType, string> = {
  WALK: "Walk",
  TROT: "Trot",
  CANTER: "Light canter",
  BREEZE: "Breeze (speed work)",
  TRIAL: "Trial run",
  SWIM: "Recovery swim",
  TREADMILL: "Treadmill",
};

export const INTENSITY_LABEL: Record<ExerciseIntensity, string> = {
  LIGHT: "Light",
  MEDIUM: "Medium",
  HEAVY: "Heavy",
};

export const TRACK_LABEL: Record<TrackType, string> = {
  TURF: "Turf",
  DIRT: "Dirt",
  SYNTHETIC: "Synthetic",
  NONE: "Not applicable",
};

export const CANCEL_REASON_LABEL: Record<CancelWorkoutReason, string> = {
  WEATHER: "Weather",
  TRACK_CONDITION: "Track not safe",
  HORSE_HEALTH: "Horse health",
  PLAN_CHANGE: "Plan change",
  OTHER: "Other",
};

/** Chạy tốc độ và Chạy thử luôn là bài nặng (giống BE training-rules.ts). */
export const ALWAYS_HEAVY: ExerciseType[] = ["BREEZE", "TRIAL"];
export const NO_SURFACE: ExerciseType[] = ["SWIM", "TREADMILL"];
export function isHeavy(type: ExerciseType, intensity: ExerciseIntensity): boolean {
  return intensity === "HEAVY" || ALWAYS_HEAVY.includes(type);
}

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
  horseStatus?: string;
  targetDistanceMeters?: number | null;
  targetSpeedKmh?: number | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: PlanStatus;
  phases: TrainingPhase[];
  headTrainerName: string;
  workoutCount: number;
  cancelledReason?: string | null;
  completionSummary?: string | null;
  createdAt: string;
  isLockedByMedical: boolean;
}

export interface SessionResult {
  actualDurationSeconds?: number | null;
  avgSpeedKmh?: number | null;
  maxSpeedKmh?: number | null;
  maxHeartRate?: number | null;
  recoveryHeartRate?: number | null;
  performanceScore?: number | null;
  hasAbnormalSigns: boolean;
  abnormalSignsDescription?: string | null;
  headTrainerFeedback?: string | null;
  recordedAt?: string | null;
}

export interface ExerciseSession {
  id: string;
  planId: string;
  planName?: string;
  horseId: string;
  horseName: string;
  horseCode?: string;
  isHorseLocked: boolean;
  scheduledAt: string; // ISO
  sessionDate: string; // YYYY-MM-DD (giờ câu lạc bộ)
  startTime: string; // HH:mm (giờ câu lạc bộ)
  sessionType: ExerciseType;
  intensity: ExerciseIntensity;
  status: SessionStatus;
  groomId?: string | null;
  groomName?: string | null;
  jockeyName?: string | null;
  trackType: TrackType;
  targetDistanceMeters: number;
  repetitions: number;
  targetSpeedKmh?: number | null;
  notes?: string | null;
  statusReason?: string | null;
  medicalOverride: boolean;
  result?: SessionResult;
}

/** Dữ liệu gửi khi thêm / sửa buổi tập (DL-2.01). */
export interface SessionInput {
  scheduledDate: string; // ISO kèm +07:00
  workoutType: ExerciseType;
  intensity: ExerciseIntensity;
  distanceMeters: number;
  repetitions?: number;
  targetSpeedKmh?: number;
  trackSurface: TrackType;
  jockeyName?: string;
  assignedStaffUserId: string;
  trainerNotes?: string;
  vetConsulted?: boolean;
}

export interface ResultInput {
  actualTimeSeconds?: number;
  heartRatePeak?: number;
  heartRateRecovery?: number;
  averageSpeedKmh?: number;
  topSpeedKmh?: number;
  performanceScore?: number;
  trainerNotes?: string;
  abnormalSigns?: boolean;
  abnormalNotes?: string;
}

export interface FitnessMetricPoint {
  workoutId: string;
  date: string;
  sessionName: string;
  avgSpeedKmh: number | null;
  maxSpeedKmh: number | null;
  maxHeartRate: number | null;
  recoveryScore: number | null;
  staminaScore: number | null;
  performanceScore: number | null;
  hasAlert: boolean;
}

/** Cảnh báo dấu hiệu bất thường sau buổi tập (FR-2.14) = một buổi tập có abnormalSigns. */
export interface TrainingAlert {
  id: string; // id buổi tập
  horseId: string;
  horseName: string;
  sessionDate: string;
  sessionType: ExerciseType;
  message: string;
  createdAt: string;
  acknowledgedByVet: boolean;
  vetNotes?: string | null;
}

export interface Groom {
  id: string;
  fullName: string;
}
