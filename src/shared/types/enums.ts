// Các giá trị enum dùng chung cho CẢ HAI cặp FE. Khớp NGUYÊN VĂN với SRS §7.3 và backend.
// Không đổi tên/giá trị ở đây nếu chưa thống nhất với backend.

// 5 vai trò của hệ thống.
export type Role = "HEAD_TRAINER" | "VETERINARIAN" | "GROOM" | "HORSE_OWNER" | "CLUB_MANAGER";
export const ROLES: Role[] = ["HEAD_TRAINER", "VETERINARIAN", "GROOM", "HORSE_OWNER", "CLUB_MANAGER"];

// horses.health_status. Con ngựa KHÔNG có trạng thái "bị khóa": khóa huấn luyện là bản ghi training_lock riêng.
export type HealthStatus = "FIT" | "UNDER_OBSERVATION" | "INJURED" | "QUARANTINED";
export const HEALTH_STATUSES: HealthStatus[] = ["FIT", "UNDER_OBSERVATION", "INJURED", "QUARANTINED"];

// training_plans.status. Giáo án của ngựa đang bị khóa là SUSPENDED (không phải "LOCKED").
export type TrainingPlanStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "SUSPENDED";

// training_lock.scope
export type TrainingLockScope = "FULL" | "HIGH_INTENSITY_ONLY";
