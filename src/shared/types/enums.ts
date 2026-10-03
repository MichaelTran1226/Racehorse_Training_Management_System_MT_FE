// Các giá trị enum dùng chung cho CẢ HAI cặp FE. Khớp NGUYÊN VĂN với SRS, schema.prisma và main.md.
// Không đổi tên/giá trị ở đây nếu chưa thống nhất với backend.

// 5 vai trò của hệ thống.
export type Role = "HEAD_TRAINER" | "VETERINARIAN" | "GROOM" | "HORSE_OWNER" | "CLUB_MANAGER";
export const ROLES: Role[] = ["HEAD_TRAINER", "VETERINARIAN", "GROOM", "HORSE_OWNER", "CLUB_MANAGER"];

// 7 trạng thái sức khỏe / vòng đời ngựa (khớp 100% với schema.prisma HorseStatus và đặc tả BA Flow 1).
export type HorseStatus =
  | "ACTIVE"
  | "IN_TRAINING"
  | "UNDER_OBSERVATION"
  | "INJURED"
  | "ISOLATED"
  | "RESTING"
  | "RETIRED";

// Alias tương thích ngược
export type HealthStatus = HorseStatus | "FIT" | "QUARANTINED";

export const HORSE_STATUSES: HorseStatus[] = [
  "ACTIVE",
  "IN_TRAINING",
  "UNDER_OBSERVATION",
  "INJURED",
  "ISOLATED",
  "RESTING",
  "RETIRED",
];
export const HEALTH_STATUSES: HealthStatus[] = [
  "ACTIVE",
  "IN_TRAINING",
  "UNDER_OBSERVATION",
  "INJURED",
  "ISOLATED",
  "RESTING",
  "RETIRED",
  "FIT",
  "QUARANTINED",
];

// 5 trạng thái giáo án huấn luyện (khớp 100% với schema.prisma PlanStatus).
export type PlanStatus = "DRAFT" | "APPROVED" | "ACTIVE" | "COMPLETED" | "SUSPENDED";
export type TrainingPlanStatus = PlanStatus | "PAUSED";
export const PLAN_STATUSES: PlanStatus[] = ["DRAFT", "APPROVED", "ACTIVE", "COMPLETED", "SUSPENDED"];

// training_lock.scope
export type TrainingLockScope = "FULL" | "HIGH_INTENSITY_ONLY";
