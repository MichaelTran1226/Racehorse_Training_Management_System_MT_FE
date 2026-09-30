import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { capitalize } from "@/shared/lib/format";
import { ROLE_NAV, ROLE_WORKSPACE } from "@/shared/lib/permissions";

// Chỗ giữ cho các màn hình của Priority 2–7 (ngựa, huấn luyện, y tế...). Menu đã trỏ tới đây;
// khi làm xong màn nào thì thêm route riêng vào src/app/router.tsx để thay thế.
export default function ComingSoonPage({ slug }: { slug: string }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  // Tìm mục menu (của chính vai trò này) có id trùng đoạn đầu của URL.
  const group = ROLE_NAV[user.role].find((g) => g.items.some((it) => it.id === slug));
  const item = group?.items.find((it) => it.id === slug);
  const found = group && item ? { group, item } : undefined;

  if (!found) {
    return (
      <Card>
        <EmptyState
          icon="map"
          title="This page does not exist."
          description="Check the address, or go back to your workspace."
          action={
            <Button size="sm" icon="home" onClick={() => navigate("/dashboard")}>
              Back to my workspace
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <PageHeader eyebrow={`${ROLE_WORKSPACE[user.role]} · ${capitalize(found.group.label)}`.toUpperCase()} title={`${found.item.label} arrives in a later phase.`} />
      <Card>
        <EmptyState
          icon={found.item.icon}
          title={`${found.item.label} is not built yet.`}
          description="Your permissions already allow this screen. It opens here as soon as its priority is built."
        />
      </Card>
    </>
  );
}
