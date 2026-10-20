import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { useAppLanguage } from "@/shared/lib/language";
import { DashboardHeroBanner } from "../components/DashboardHeroBanner";
import {
  GroomDashboard,
  ManagerDashboard,
  OwnerDashboard,
  TrainerDashboard,
  VetDashboard,
} from "../components/RoleDashboards";

/** Q-0.01 = B: sau đăng nhập mỗi vai trò thấy dashboard của mình (cùng đường dẫn /dashboard). */
export default function DashboardPage() {
  const user = useCurrentUser();
  const { lang } = useAppLanguage();

  return (
    <div key={lang} style={{ display: "grid", gap: 20 }}>
      <DashboardHeroBanner user={user} />
      {user.role === "CLUB_MANAGER" && <ManagerDashboard user={user} />}
      {user.role === "HEAD_TRAINER" && <TrainerDashboard />}
      {user.role === "VETERINARIAN" && <VetDashboard />}
      {user.role === "GROOM" && <GroomDashboard />}
      {user.role === "HORSE_OWNER" && <OwnerDashboard />}
    </div>
  );
}
