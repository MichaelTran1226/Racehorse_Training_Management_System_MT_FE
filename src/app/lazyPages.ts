// Màn Y tế và Huấn luyện tải theo route (React.lazy): file JS đầu tiên nhẹ hơn. Đường dẫn khai báo ở router.tsx.
import { lazy } from "react";

export const MedicalRecordPage = lazy(() => import("@/features/health/pages/MedicalRecordPage"));
export const RecordListPage = lazy(() => import("@/features/health/pages/RecordListPage"));
export const RecordDetailPage = lazy(() => import("@/features/health/pages/RecordDetailPage"));
export const RecordFormPage = lazy(() => import("@/features/health/pages/RecordFormPage"));
export const InjuryMapPage = lazy(() => import("@/features/health/pages/InjuryMapPage"));
export const TrainingLockPage = lazy(() => import("@/features/health/pages/TrainingLockPage"));
export const CareSchedulePage = lazy(() => import("@/features/health/pages/CareSchedulePage"));
export const HerdHealthPage = lazy(() => import("@/features/health/pages/HerdHealthPage"));
export const PlanListPage = lazy(() => import("@/features/training/pages/PlanListPage"));
export const PlanWizardPage = lazy(() => import("@/features/training/pages/PlanWizardPage"));
export const PlanHistoryPage = lazy(() => import("@/features/training/pages/PlanHistoryPage"));
export const WeeklyCalendarPage = lazy(() => import("@/features/training/pages/WeeklyCalendarPage"));
export const TrialRunsPage = lazy(() => import("@/features/training/pages/TrialRunsPage"));
export const SessionMetricsPage = lazy(() => import("@/features/training/pages/SessionMetricsPage"));
export const LiveMonitorPage = lazy(() => import("@/features/training/pages/LiveMonitorPage"));
export const AlertListPage = lazy(() => import("@/features/training/pages/AlertListPage"));
export const TrainingOverviewPage = lazy(() => import("@/features/training/pages/TrainingOverviewPage"));
export const PlanDetailPage = lazy(() => import("@/features/training/pages/PlanDetailPage"));
export const SessionResultPage = lazy(() => import("@/features/training/pages/SessionResultPage"));
export const FitnessChartPage = lazy(() => import("@/features/training/pages/FitnessChartPage"));
export const MyTrainingPage = lazy(() => import("@/features/training/pages/MyTrainingPage"));
