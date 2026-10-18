import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import {
  GroomDashboard,
  ManagerDashboard,
  OwnerDashboard,
  TrainerDashboard,
  VetDashboard,
} from "../components/RoleDashboards";

import { tr } from "@/shared/i18n/tr";
const DESCRIPTION: Record<string, string> = {
  CLUB_MANAGER: "Club overview: horses, training, medical safety and stall capacity.",
  HEAD_TRAINER: "Today's workouts, horses to watch and abnormal-sign alerts.",
  VETERINARIAN: "Alerts to review, Training Lock reviews and overdue preventive care.",
  GROOM: "Your workouts today and the horses you look after.",
  HORSE_OWNER: "Your horses and their training progress.",
};

/** Q-0.01 = B: sau đăng nhập mỗi vai trò thấy dashboard của mình (cùng đường dẫn /dashboard). */
export default function DashboardPage() {
  const user = useCurrentUser();
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <PageHeader
        title={tr("Dashboard")}
        description={DESCRIPTION[user.role]}
        showDate
      />
      {user.role === "CLUB_MANAGER" && <ManagerDashboard user={user} />}
      {user.role === "HEAD_TRAINER" && <TrainerDashboard />}
      {user.role === "VETERINARIAN" && <VetDashboard />}
      {user.role === "GROOM" && <GroomDashboard />}
      {user.role === "HORSE_OWNER" && <OwnerDashboard />}
    </div>
  );
}
