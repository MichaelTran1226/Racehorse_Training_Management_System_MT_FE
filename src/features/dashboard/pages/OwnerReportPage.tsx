import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";

export default function OwnerReportPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="SCHEDULED SPRINT MODULE"
        title="Horse Owner Reports"
        description="This operational module is scheduled for implementation in accordance with the project sprint plan."
      />
      <Card pad={32}>
        <EmptyState
          title="Horse Owner Reports · Under Development"
          description="Feature implementation will become available in the designated milestone."
        />
      </Card>
    </div>
  );
}
