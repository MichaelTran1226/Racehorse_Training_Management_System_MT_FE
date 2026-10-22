import { createBrowserRouter, Navigate } from "react-router-dom";
import AuditLogPage from "@/features/dashboard/pages/AuditLogPage";
import AccountListPage from "@/features/accounts/pages/AccountListPage";
import StaffDirectoryPage from "@/features/master-data/pages/StaffDirectoryPage";
import HorseListPage from "@/features/horses/pages/HorseListPage";
import HorseDetailPage from "@/features/horses/pages/HorseDetailPage";
import HorseFormPage from "@/features/horses/pages/HorseFormPage";
import DeletedHorsesPage from "@/features/horses/pages/DeletedHorsesPage";
import AcceptInvitePage from "@/features/auth/pages/AcceptInvitePage";
import ChangePasswordPage from "@/features/auth/pages/ChangePasswordPage";
import Forbidden403Page from "@/features/auth/pages/Forbidden403Page";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import MyProfilePage from "@/features/auth/pages/MyProfilePage";
import PendingApprovalPage from "@/features/auth/pages/PendingApprovalPage";
import ResetOtpPage from "@/features/auth/pages/ResetOtpPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import SessionExpiredPage from "@/features/auth/pages/SessionExpiredPage";
import SignUpPage from "@/features/auth/pages/SignUpPage";
import VerifyEmailPage from "@/features/auth/pages/VerifyEmailPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import NotificationsPage from "@/features/dashboard/pages/NotificationsPage";
import NotificationSettingsPage from "@/features/dashboard/pages/NotificationSettingsPage";
import HorseCatalogPage from "@/features/horses/pages/HorseCatalogPage";
import StableMapPage from "@/features/stable/pages/StableMapPage";
import StallCatalogPage from "@/features/stable/pages/StallCatalogPage";
import SuppliesCatalogPage from "@/features/master-data/pages/SuppliesCatalogPage";
import ShiftCatalogPage from "@/features/master-data/pages/ShiftCatalogPage";
import ShiftRosterPage from "@/features/stable/pages/ShiftRosterPage";
import MealRationsPage from "@/features/stable/pages/MealRationsPage";
import DailyChecklistPage from "@/features/stable/pages/DailyChecklistPage";
import IncidentListPage from "@/features/stable/pages/IncidentListPage";
import InventoryPage from "@/features/stable/pages/InventoryPage";
import RestockRequestsPage from "@/features/stable/pages/RestockRequestsPage";
import {
  MedicalRecordPage,
  RecordListPage,
  RecordDetailPage,
  RecordFormPage,
  InjuryMapPage,
  TrainingLockPage,
  CareSchedulePage,
  HerdHealthPage,
  PlanListPage,
  PlanWizardPage,
  PlanHistoryPage,
  WeeklyCalendarPage,
  TrialRunsPage,
  SessionMetricsPage,
  LiveMonitorPage,
  AlertListPage,
  TrainingOverviewPage,
  PlanDetailPage,
  SessionResultPage,
  FitnessChartPage,
  MyTrainingPage,
  RaceEntryPage,
  RaceResultsPage,
  OwnerFinancialReportsPage,
} from "./lazyPages";
import {
  AppLayout,
  ComingSoonRoute,
  PermissionMatrixRoute,
  RootLayout,
  RouteErrorBoundary,
  TrainingProgressRoute,
} from "./RouteLayouts";


export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/", element: <Navigate to="/login" replace /> },

      // ---- Trang công khai (chưa đăng nhập)
      { path: "/login", element: <LoginPage /> },
      { path: "/sign-up", element: <SignUpPage /> },
      { path: "/sign-up/verify", element: <VerifyEmailPage /> },
      { path: "/sign-up/pending", element: <PendingApprovalPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/forgot-password/verify", element: <ResetOtpPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> },
      { path: "/accept-invite", element: <AcceptInvitePage /> },

      // ---- Trang sau đăng nhập (nằm trong khung AppShell)
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/audit", element: <AuditLogPage /> },
          { path: "/accounts", element: <AccountListPage /> },
          { path: "/accounts/:id/permissions", element: <PermissionMatrixRoute /> },
          { path: "/staff", element: <StaffDirectoryPage /> },
          { path: "/horses", element: <HorseListPage /> },
          { path: "/horses/new", element: <HorseFormPage /> },
          { path: "/horses/deleted", element: <DeletedHorsesPage /> },
          { path: "/horses/:id", element: <HorseDetailPage /> },
          { path: "/horses/:id/edit", element: <HorseFormPage /> },
          { path: "/my-horses", element: <HorseListPage /> },
          { path: "/profile", element: <MyProfilePage /> },
          { path: "/profile/password", element: <ChangePasswordPage /> },
          { path: "/notifications", element: <NotificationsPage /> },
          { path: "/notifications/settings", element: <NotificationSettingsPage /> },
          { path: "/settings/notifications", element: <NotificationSettingsPage /> },
          { path: "/forbidden", element: <Forbidden403Page /> },
          { path: "/session-expired", element: <SessionExpiredPage /> },

          // ---- Phân hệ Y tế & Sức khỏe (Flow 3: P2-01 -> P2-05)
          { path: "/records", element: <RecordListPage /> },
          { path: "/medical/records", element: <RecordListPage /> },
          { path: "/medical/records/new", element: <RecordFormPage /> },
          { path: "/medical/records/:id/edit", element: <RecordFormPage /> },
          { path: "/medical/records/:id", element: <RecordDetailPage /> },
          { path: "/medical/horses/:id", element: <MedicalRecordPage /> },
          { path: "/records/horse/:id", element: <MedicalRecordPage /> },
          { path: "/medical/horses/:id/injuries", element: <InjuryMapPage /> },
          { path: "/injuries/:id", element: <InjuryMapPage /> },
          { path: "/injuries", element: <InjuryMapPage /> },
          { path: "/medical/locks", element: <TrainingLockPage /> },
          { path: "/rx", element: <Navigate to="/records" replace /> },
          { path: "/locks", element: <TrainingLockPage /> },
          { path: "/medical/preventive", element: <CareSchedulePage /> },
          { path: "/catalogs/preventive-types", element: <CareSchedulePage /> },
          { path: "/vaccine", element: <CareSchedulePage /> },
          { path: "/medical/herd", element: <HerdHealthPage /> },
          { path: "/herd", element: <HerdHealthPage /> },

          // ---- Phân hệ Huấn luyện & Giáo án (Flow 2: P2-06 -> P2-09)
          { path: "/training", element: <TrainingOverviewPage /> },
          { path: "/progress", element: <TrainingProgressRoute /> },
          { path: "/training/plans", element: <PlanListPage /> },
          { path: "/plans", element: <PlanListPage /> },
          { path: "/training/plans/new", element: <PlanWizardPage /> },
          { path: "/plans/new", element: <PlanWizardPage /> },
          { path: "/training/plans/:id", element: <PlanDetailPage /> },
          { path: "/plans/:id", element: <PlanDetailPage /> },
          { path: "/training/plans/:id/edit", element: <PlanWizardPage /> },
          { path: "/training/plans/history", element: <PlanHistoryPage /> },
          { path: "/training/sessions/:id/result", element: <SessionResultPage /> },
          { path: "/horses/:id/fitness", element: <FitnessChartPage /> },
          { path: "/my-training", element: <MyTrainingPage /> },
          { path: "/my/training", element: <MyTrainingPage /> },
          { path: "/training/calendar", element: <WeeklyCalendarPage /> },
          { path: "/training/schedule", element: <WeeklyCalendarPage /> },
          { path: "/calendar", element: <WeeklyCalendarPage /> },
          { path: "/training/trials", element: <TrialRunsPage /> },
          { path: "/trials", element: <TrialRunsPage /> },
          { path: "/training/metrics", element: <SessionMetricsPage /> },
          { path: "/metrics", element: <SessionMetricsPage /> },
          { path: "/training/monitor", element: <LiveMonitorPage /> },
          { path: "/monitor", element: <LiveMonitorPage /> },
          { path: "/training/alerts", element: <AlertListPage /> },
          { path: "/alerts", element: <AlertListPage /> },

          // ---- Phân hệ Chuồng trại (Flow 4 & P1-09)
          { path: "/stables/map", element: <StableMapPage /> },
          { path: "/stalls", element: <StableMapPage /> },
          { path: "/catalogs/stalls", element: <StallCatalogPage /> },
          { path: "/catalogs/breeds", element: <HorseCatalogPage /> },
          { path: "/catalogs/supplies", element: <SuppliesCatalogPage /> },
          { path: "/catalog", element: <Navigate to="/catalogs/supplies" replace /> },
          { path: "/catalogs/shifts", element: <ShiftCatalogPage /> },
          { path: "/stable/shifts", element: <ShiftRosterPage /> },
          { path: "/shifts", element: <Navigate to="/stable/shifts" replace /> },
          { path: "/rations", element: <MealRationsPage /> },
          { path: "/stable/rations", element: <Navigate to="/rations" replace /> },
          { path: "/stable/meals", element: <Navigate to="/rations" replace /> },
          { path: "/tasks", element: <DailyChecklistPage /> },
          { path: "/checklist", element: <Navigate to="/tasks" replace /> },
          { path: "/stable/tasks", element: <Navigate to="/tasks" replace /> },
          { path: "/incidents", element: <IncidentListPage /> },
          { path: "/stable/incidents", element: <Navigate to="/incidents" replace /> },

          // ---- Phân hệ Vật tư & Tồn kho khu chuồng (Flow 4: Phase 4)
          { path: "/supplies/inventory", element: <InventoryPage /> },
          { path: "/inventory", element: <Navigate to="/supplies/inventory" replace /> },
          { path: "/supplies", element: <Navigate to="/supplies/inventory" replace /> },
          { path: "/supplies/requests", element: <RestockRequestsPage /> },
          { path: "/restock-requests", element: <Navigate to="/supplies/requests" replace /> },

          // ---- Phân hệ Thi đấu & Giải đua (Flow 5: SC-5.01 -> SC-5.04)
          { path: "/races", element: <RaceEntryPage /> },
          { path: "/races/results", element: <RaceResultsPage /> },
          { path: "/racing", element: <RaceEntryPage /> },

          // ---- Phân hệ Tài chính & Quyết toán (Flow 5: SC-5.05 -> SC-5.06)
          { path: "/financial-reports", element: <OwnerFinancialReportsPage /> },
          { path: "/owner/financial-reports", element: <OwnerFinancialReportsPage /> },
          { path: "/invoices", element: <OwnerFinancialReportsPage /> },

          { path: "*", element: <ComingSoonRoute /> },
        ],
      },
    ],
  },
]);

