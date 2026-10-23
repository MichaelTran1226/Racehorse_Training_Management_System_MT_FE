// Dữ liệu giả Flow 2 – lưu ĐÚNG dạng bảng TrainingPlan / WorkoutSession của BE,
// để chế độ mock và chế độ thật đi qua cùng một hàm chuyển đổi (features/training/api.ts).
import type { BePlan, BeWorkout } from "@/features/training/api";

const PLANS_STORAGE_KEY = "equiflow.training.plans.v4";
const WORKOUTS_STORAGE_KEY = "equiflow.training.workouts.v4";

/** Bản ghi lưu trong trình duyệt: như BE nhưng chưa gắn horse / trainer / assignedStaff. */
export type MockPlan = Omit<BePlan, "horse" | "trainer" | "_count"> & { trainerUserId: string };
export type MockWorkout = Omit<BeWorkout, "horse" | "assignedStaff" | "trainingPlan" | "resultRecordedBy" | "resultUpdatedBy"> & {
  resultRecordedById?: string | null;
  resultUpdatedById?: string | null;
};

const DAY = 24 * 60 * 60 * 1000;
/** ISO của ngày (hôm nay + offset) lúc HH:mm giờ câu lạc bộ (UTC+7). */
function at(offsetDays: number, time = "00:00"): string {
  const local = new Date(Date.now() + 7 * 60 * 60 * 1000 + offsetDays * DAY).toISOString().slice(0, 10);
  return new Date(`${local}T${time}:00+07:00`).toISOString();
}

/** YYYY-MM-DD (giờ câu lạc bộ) của hôm nay + offset. */
export function clubDay(offsetDays: number): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000 + offsetDays * DAY).toISOString().slice(0, 10);
}

function phase(id: string, name: string, type: string, from: number, to: number, maxWeeklyDistance: number, surface = "TURF") {
  return { id, name, type, startDate: clubDay(from), endDate: clubDay(to), sessionsPerWeek: 5, maxWeeklyDistance, surface };
}

function initialPlans(): MockPlan[] {
  const base = { cancelReason: null, completionSummary: null, notes: null, trainerUserId: "seed-trainer" };
  return [
    { ...base, id: "plan-1", planCode: "GA-000001", horseId: "horse-1", phaseName: "Derby speed & stamina 2026", objective: "Peak for the autumn Derby over 2000 m.", targetDistance: 2000, targetSpeed: 58, startDate: at(-20), endDate: at(40), status: "ACTIVE", createdAt: at(-21),
      phases: [phase("ph-1", "Aerobic base", "BASE", -20, -6, 9000), phase("ph-2", "Speed work", "SPEED", -5, 20, 12000), phase("ph-3", "Tapering", "PRE_RACE", 21, 40, 8000)] },
    { ...base, id: "plan-2", planCode: "GA-000002", horseId: "horse-2", phaseName: "Rehabilitation & low-impact conditioning", objective: "Return to light work while the tendon heals.", targetDistance: 800, targetSpeed: 25, startDate: at(-5), endDate: at(25), status: "ACTIVE", createdAt: at(-6),
      phases: [phase("ph-r1", "Hand walking & gentle trot", "RECOVERY", -5, 25, 5000)] },
    { ...base, id: "plan-3", planCode: "GA-000003", horseId: "horse-3", phaseName: "Autumn base building", objective: "Build an aerobic base before the winter races.", targetDistance: 1600, targetSpeed: 45, startDate: at(0), endDate: at(30), status: "DRAFT", createdAt: at(-1),
      phases: [phase("ph-a1", "Base", "BASE", 0, 30, 9000)] },
    { ...base, id: "plan-4", planCode: "GA-000004", horseId: "horse-1", phaseName: "Summer adaptation 2026", objective: "Adapt to summer heat.", targetDistance: 1600, targetSpeed: 48, startDate: at(-80), endDate: at(-35), status: "COMPLETED", completionSummary: "Sprint speed improved by 5.8 km/h; recovery normal.", createdAt: at(-81),
      phases: [phase("ph-s1", "Adaptation", "BASE", -80, -35, 9000)] },
  ];
}

function workout(partial: Partial<MockWorkout> & Pick<MockWorkout, "id" | "trainingPlanId" | "horseId" | "scheduledDate" | "status">): MockWorkout {
  return {
    phaseId: null,
    workoutType: "CANTER",
    intensity: "MEDIUM",
    trackSurface: "TURF",
    distanceMeters: 1200,
    repetitions: 1,
    targetSpeedKmh: null,
    jockeyName: null,
    assignedStaffUserId: "seed-groom",
    trainerNotes: null,
    statusReason: null,
    medicalOverride: false,
    abnormalSigns: false,
    abnormalNotes: null,
    vetAcknowledgedAt: null,
    vetNotes: null,
    resultRecordedAt: null,
    abnormalSignTypes: [],
    ...partial,
  };
}

function initialWorkouts(): MockWorkout[] {
  return [
    workout({ id: "w-101", phaseId: "ph-1", trainingPlanId: "plan-1", horseId: "horse-1", scheduledDate: at(-7, "07:00"), status: "COMPLETED", actualTimeSeconds: 72, heartRatePeak: 175, heartRateRecovery: 108, averageSpeedKmh: 60, topSpeedKmh: 64.2, performanceScore: 8.9, actualDistanceMeters: 1200, completionLevel: "ACHIEVED", resultNotes: "Strong forward stride in the final 200m.", resultRecordedAt: at(-7, "09:00") }),
    workout({ id: "w-105", phaseId: "ph-2", trainingPlanId: "plan-1", horseId: "horse-1", scheduledDate: at(-3, "06:30"), status: "COMPLETED", heartRatePeak: 192, performanceScore: 6.5, actualDistanceMeters: 1200, actualTimeSeconds: 85, averageSpeedKmh: 50.8, completionLevel: "PARTIAL", resultNotes: "Faded in the last furlong.", abnormalSigns: true, abnormalSignTypes: ["LAMENESS", "PROLONGED_BREATHING"], abnormalNotes: "Heart rate stayed above 190 bpm; slight hesitation on the left fore.", resultRecordedAt: at(-3, "08:00") }),
    workout({ id: "w-102", phaseId: "ph-2", trainingPlanId: "plan-1", horseId: "horse-1", scheduledDate: at(1, "06:30"), status: "SCHEDULED", workoutType: "TRIAL", intensity: "HEAVY", distanceMeters: 1000, targetSpeedKmh: 55, jockeyName: "Alex Turner" }),
    workout({ id: "w-106", phaseId: "ph-2", trainingPlanId: "plan-1", horseId: "horse-1", scheduledDate: at(0, "00:00"), status: "SCHEDULED", workoutType: "TRIAL", intensity: "HEAVY", distanceMeters: 1200, targetSpeedKmh: 58, jockeyName: "Alex Turner" }),
    workout({ id: "w-103", phaseId: "ph-r1", trainingPlanId: "plan-2", horseId: "horse-2", scheduledDate: at(1, "07:00"), status: "BLOCKED", intensity: "HEAVY", statusReason: "Training lock: swelling on the fore tendon" }),
    workout({ id: "w-104", phaseId: "ph-r1", trainingPlanId: "plan-2", horseId: "horse-2", scheduledDate: at(1, "16:00"), status: "SCHEDULED", workoutType: "WALK", intensity: "LIGHT", distanceMeters: 600, trainerNotes: "20 minutes hand walk." }),
  ];
}

function load<T>(key: string, init: () => T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T[];
  } catch {
    // localStorage không dùng được
  }
  const data = init();
  save(key, data);
  return data;
}

function save<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage không dùng được
  }
}

export const getStoredPlans = (): MockPlan[] => load(PLANS_STORAGE_KEY, initialPlans);
export const saveStoredPlans = (plans: MockPlan[]): void => save(PLANS_STORAGE_KEY, plans);
export const getStoredWorkouts = (): MockWorkout[] => load(WORKOUTS_STORAGE_KEY, initialWorkouts);
export const saveStoredWorkouts = (rows: MockWorkout[]): void => save(WORKOUTS_STORAGE_KEY, rows);

/** Giống BE khi VET đặt Khóa y tế: chỉ buổi NẶNG đã lên lịch -> Bị chặn. */
export function blockHeavyWorkouts(horseId: string, reason: string): void {
  const rows = getStoredWorkouts();
  for (const w of rows) {
    const heavy = w.intensity === "HEAVY" || w.workoutType === "BREEZE" || w.workoutType === "TRIAL";
    if (w.horseId === horseId && w.status === "SCHEDULED" && heavy) {
      w.status = "BLOCKED";
      w.statusReason = reason;
    }
  }
  saveStoredWorkouts(rows);
}
