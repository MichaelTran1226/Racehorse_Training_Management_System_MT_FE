import type { TrainingPlan } from "@/features/training/types";

const PLANS_STORAGE_KEY = "equiflow.training.plans.v2";

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
    phases: [],
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
