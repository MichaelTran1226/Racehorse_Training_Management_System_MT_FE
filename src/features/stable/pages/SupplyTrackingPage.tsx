import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";

import { tr } from "@/shared/i18n/tr";
export default function SupplyTrackingPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PageHeader
        title={tr("Stable Supply Tracking")}
        description={tr("This operational module is scheduled for implementation in accordance with the project sprint plan.")}
      />
      <Card pad={32}>
        <EmptyState
          title={tr("Stable Supply Tracking · Under Development")}
          description={tr("Feature implementation will become available in the designated milestone.")}
        />
      </Card>
    </div>
  );
}
