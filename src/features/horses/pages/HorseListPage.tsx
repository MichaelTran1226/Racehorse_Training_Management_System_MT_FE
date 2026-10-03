import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { Card } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/form/Input";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { HEALTH_STATUS } from "@/shared/lib/status";
import type { HealthStatus } from "@/shared/types/enums";
import { getHorses } from "../api";
import type { Horse } from "../types";

export default function HorseListPage() {
  const currentUser = useCurrentUser();
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    let active = true;
    getHorses()
      .then((data) => {
        if (active) setHorses(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredHorses = useMemo(() => {
    return horses.filter((h) => {
      if (statusFilter !== "ALL" && h.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          h.name.toLowerCase().includes(q) ||
          h.microchipRfid.toLowerCase().includes(q) ||
          h.breed.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [horses, statusFilter, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="EQUINE INVENTORY & PROFILES"
        title="Horse Registry"
        description="Comprehensive master horse registry, identity tracking, medical status, and stable allocations."
        action={
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link to="/herd">
              <Button tone="secondary" size="md">
                View Herd Health Board
              </Button>
            </Link>
            {currentUser.permissions.editHorses && (
              <Link to="/herd">
                <Button tone="primary" size="md">
                  + Add / Register Horse
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <Card pad={16}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["ALL", "ACTIVE", "UNDER_OBSERVATION", "INJURED", "ISOLATED"].map((st) => (
              <Button
                key={st}
                size="sm"
                tone={statusFilter === st ? "primary" : "secondary"}
                onClick={() => setStatusFilter(st)}
              >
                {st === "ALL" ? `All Horses (${horses.length})` : `${HEALTH_STATUS[st as HealthStatus]?.label || st} (${horses.filter((h) => h.status === st).length})`}
              </Button>
            ))}
          </div>

          <div style={{ minWidth: 260 }}>
            <Input
              placeholder="Search horse by name, RFID, breed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          Loading horse profiles...
        </div>
      ) : filteredHorses.length === 0 ? (
        <Card pad={32}>
          <EmptyState
            title="No horses found"
            description="No horse records match your filter or search query."
          />
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {filteredHorses.map((horse) => {
            const statusCfg = HEALTH_STATUS[horse.status as HealthStatus] || { label: horse.status, tone: "neutral" };
            return (
              <Card key={horse.id} pad={20}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
                        {horse.name}
                      </h3>
                      <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                        {horse.microchipRfid} · {horse.breed}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                      <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
                      {horse.isMedicalLocked && (
                        <Badge tone="danger">Medical Locked</Badge>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--ink-muted, #64748b)" }}>
                    <div>
                      <strong>Gender:</strong> {horse.gender}
                    </div>
                    <div>
                      <strong>Color:</strong> {horse.color}
                    </div>
                    <div>
                      <strong>Stall:</strong> {horse.stallCode || "Unassigned"}
                    </div>
                    <div>
                      <strong>DOB:</strong> {horse.dob}
                    </div>
                  </div>

                  <div style={{ marginTop: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border, #e2e8f0)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Link
                      to={`/medical/horses/${horse.id}`}
                      style={{ fontSize: "0.8125rem", color: "var(--brand, #16a34a)", fontWeight: 600, textDecoration: "underline" }}
                    >
                      Medical Profile (6 Tabs) →
                    </Link>

                    <Link
                      to={`/medical/horses/${horse.id}/injuries`}
                      style={{ fontSize: "0.8125rem", color: "var(--accent, #2563eb)", textDecoration: "underline" }}
                    >
                      2D Injury Map
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
