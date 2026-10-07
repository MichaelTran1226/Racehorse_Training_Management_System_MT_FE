import type { TrainingPlan } from "@/features/training/types";

const PLANS_STORAGE_KEY = "equiflow.training.plans.v1";

const INITIAL_MOCK_PLANS: TrainingPlan[] = [
  {
    id: "plan-1",
    planCode: "GA-2026-001",
    name: "Giáo án Tăng cường Sức bền - Derby Mùa Thu",
    horseId: "horse-1",
    horseName: "Thần Gió (Thunderbolt)",
    horseCode: "EQ-001",
    target: "Nâng cao sức bền cơ bắp và ổn định nhịp tim giai đoạn nước rút 2000m",
    targetDistanceMeters: 2000,
    startDate: "2026-09-15",
    endDate: "2026-10-31",
    status: "ACTIVE",
    headTrainerId: "usr-ht-1",
    headTrainerName: "Nguyễn Văn Huấn (HT)",
    notes: "Tập trung phân kỳ tập nhẹ vào đầu tuần và tăng tốc cuối tuần",
    createdAt: "2026-09-10",
    updatedAt: "2026-09-28",
    phases: [
      {
        id: "phase-1",
        phaseOrder: 1,
        name: "Giai đoạn 1: Làm quen & Tăng thể tích",
        startDate: "2026-09-15",
        endDate: "2026-09-30",
        targetHeartRateMax: 140,
        targetSpeedKmh: 35,
        focus: "Đi bộ dốc, trot đều đặn và canter cự ly dài tốc độ ổn định",
      },
    ],
  },
  {
    id: "plan-2",
    planCode: "GA-2026-002",
    name: "Phục hồi thể lực nhẹ sau chấn thương dây chằng",
    horseId: "horse-2",
    horseName: "Bạch Mã Hoàng Tử (Silver Arrow)",
    horseCode: "EQ-002",
    target: "Phục hồi cơ đùi và gân bàn chân, kiểm soát nhịp tim dưới 120 bpm",
    targetDistanceMeters: 800,
    startDate: "2026-10-01",
    endDate: "2026-11-15",
    status: "DRAFT",
    headTrainerId: "usr-ht-1",
    headTrainerName: "Nguyễn Văn Huấn (HT)",
    isLockedByMedical: true,
    notes: "Đang bị khóa huấn luyện y tế. Không được xếp bài tập nặng (Canter, Gallop)!",
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
