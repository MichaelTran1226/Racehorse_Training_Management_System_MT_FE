import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { Card } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Alert } from "@/shared/components/ui/Alert";
import { Tabs } from "@/shared/components/ui/Tabs";
import { HEALTH_STATUS } from "@/shared/lib/status";
import type { HealthStatus } from "@/shared/types/enums";
import { DataTable } from "@/shared/components/ui/DataTable";
import { getHorseById, getHorseHistory } from "../api";
import type { Horse, HorseHistoryResponse } from "../types";
import { ChangeStatusDialog } from "../components/ChangeStatusDialog";
import { AssignOwnerModal } from "../components/AssignOwnerModal";
import { DeleteHorseModal } from "../components/DeleteHorseModal";

export default function HorseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useCurrentUser();
  const [horse, setHorse] = useState<Horse | null>(null);
  const [history, setHistory] = useState<HorseHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    Promise.all([
      getHorseById(id),
      getHorseHistory(id).catch(() => null),
    ])
      .then(([horseData, historyData]) => {
        if (active) {
          setHorse(horseData);
          if (historyData) setHistory(historyData);
        }
      })
      .catch((err) => {
        if (active) setError(err.message || "Horse record not found or you do not have permission to view.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const refreshHorse = () => {
    if (!id) return;
    Promise.all([
      getHorseById(id),
      getHorseHistory(id).catch(() => null),
    ])
      .then(([horseData, historyData]) => {
        setHorse(horseData);
        if (historyData) setHistory(historyData);
      })
      .catch(() => {});
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <PageHeader eyebrow="HORSE PROFILE · FLOW 1" title="Horse Profile Details" />
        <Card pad={32}>
          <p style={{ color: "var(--ink-muted, #64748b)" }}>Loading horse profile details...</p>
        </Card>
      </div>
    );
  }

  if (error || !horse) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <PageHeader eyebrow="HORSE PROFILE · FLOW 1" title="Profile Not Found" />
        <Card pad={24}>
          <Alert tone="danger" title="Horse Record Not Found">
            {error || "This horse profile does not exist or your account lacks authorization."}
          </Alert>
          <div style={{ marginTop: "1rem" }}>
            <Link to="/horses">
              <Button tone="secondary">Back to Horse Roster</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isOwner = currentUser.role === "HORSE_OWNER";
  const isGroom = currentUser.role === "GROOM";
  const isManager = currentUser.role === "CLUB_MANAGER";

  // Calculate age
  let ageText = "—";
  if (horse.dob) {
    const birthYear = new Date(horse.dob).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    ageText = `${age >= 0 ? age : 0} y/o`;
  }

  // Microchip display masking for grooms
  let displayMicrochip = horse.microchip || horse.microchipRfid || "—";
  if (isGroom && displayMicrochip !== "—" && displayMicrochip.length > 4) {
    displayMicrochip = "*".repeat(displayMicrochip.length - 4) + displayMicrochip.slice(-4);
  }

  const statusCfg = HEALTH_STATUS[horse.status as HealthStatus] || { label: horse.status, tone: "neutral" };

  // 6 Tabs according to SC-1.03 (Hide stable tabs for owners)
  const tabs = [
    { id: "info", label: "1. General Information" },
    ...(!isOwner ? [{ id: "stable", label: "2. Stabling & Care" }] : [{ id: "routine", label: "2. Daily Routine" }]),
    { id: "owner", label: "3. Ownership & Custody" },
    { id: "status-history", label: "4. Status History" },
    ...(!isOwner ? [{ id: "stall-history", label: "5. Stall History" }] : []),
    { id: "timeline", label: "6. Lifecycle Timeline" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PageHeader
        eyebrow={`HORSE ID: ${horse.horseCode || horse.id}`}
        title={horse.name}
        description={`${horse.breed} · ${horse.gender} · ${horse.color} · ${ageText}`}
        action={
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/horses">
              <Button tone="secondary">← Roster</Button>
            </Link>

            {isManager && horse.status !== "RETIRED" && (
              <Link to={`/horses/${horse.id}/edit`}>
                <Button tone="secondary">Edit Profile</Button>
              </Link>
            )}

            {isManager && horse.status !== "RETIRED" && (
              <Button tone="secondary" onClick={() => setIsOwnerModalOpen(true)}>
                Transfer Owner
              </Button>
            )}

            <ChangeStatusDialog 
              horse={horse} 
              onSuccess={(updatedHorse: Horse) => setHorse({ ...horse, status: updatedHorse.status, isMedicalLocked: updatedHorse.isMedicalLocked })} 
            />

            <Link to={`/medical/horses/${horse.id}`}>
              <Button tone="secondary">Medical Records</Button>
            </Link>

            <Link to={`/medical/horses/${horse.id}/injuries`}>
              <Button tone="secondary">2D Injury Map</Button>
            </Link>

            {isManager && (
              <Button tone="danger" onClick={() => setIsDeleteModalOpen(true)}>
                {horse.status === "RETIRED" ? "Delete Record" : "Retire / Delete"}
              </Button>
            )}
          </div>
        }
      />

      {/* Banner Medical Lock */}
      {horse.isMedicalLocked && (
        <Alert
          tone="danger"
          title="VETERINARY MEDICAL LOCK ACTIVE"
        >
          Horse is currently subject to a protective veterinary Medical Lock. Heavy training workouts and competitive trial runs are strictly prohibited until cleared by the attending Veterinarian.
          {horse.medicalLocks && horse.medicalLocks[0] && (
            <div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
              <strong>Lock Reason:</strong> {horse.medicalLocks[0].lockReason} (Placed:{" "}
              {new Date(horse.medicalLocks[0].lockedAt).toLocaleString("en-US")})
            </div>
          )}
        </Alert>
      )}

      {/* Banner Retired */}
      {horse.status === "RETIRED" && (
        <Alert tone="info" title="Horse Record Retired">
          This racehorse is retired from active stable operations (sold, retired, or deceased). Historical identity, pedigree, and health logs remain archived for reference.
        </Alert>
      )}

      <Card pad={20}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "var(--brand-surface, #f0fdf4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.75rem",
                border: "2px solid var(--border, #e2e8f0)",
              }}
            >
              🐎
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                {horse.name}
              </h2>
              <span style={{ fontSize: "0.875rem", color: "var(--ink-muted, #64748b)" }}>
                {horse.horseCode || horse.id} · {horse.breed}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
            {horse.isMedicalLocked && <Badge tone="danger">Medical Lock 🔒</Badge>}
          </div>
        </div>
      </Card>

      {/* 6 Tabs */}
      <Tabs
        items={tabs}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 1: General Info */}
      {activeTab === "info" && (
        <Card pad={24}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.125rem", fontWeight: 700 }}>
            Identity & Pedigree Information
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
              fontSize: "0.875rem",
            }}
          >
            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Horse Code (ID)</div>
              <div style={{ fontWeight: 600 }}>{horse.horseCode || horse.id}</div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Registered Name</div>
              <div style={{ fontWeight: 600 }}>{horse.name}</div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Microchip Number (15 digits)</div>
              <div style={{ fontWeight: 600, fontFamily: "monospace" }}>{displayMicrochip}</div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>RFID Tag Code</div>
              <div style={{ fontWeight: 600, fontFamily: "monospace" }}>{horse.rfid || "—"}</div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Breed</div>
              <div style={{ fontWeight: 600 }}>{horse.breed}</div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Date of Birth / Age</div>
              <div style={{ fontWeight: 600 }}>
                {horse.dob ? new Date(horse.dob).toLocaleDateString("en-US") : "—"} ({ageText})
              </div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Gender</div>
              <div style={{ fontWeight: 600 }}>{horse.gender}</div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Coat Color</div>
              <div style={{ fontWeight: 600 }}>{horse.color}</div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Operational Status</div>
              <div>
                <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
              </div>
            </div>

            <div>
              <div style={{ color: "var(--ink-muted, #64748b)", marginBottom: 4 }}>Registration Date</div>
              <div style={{ fontWeight: 600 }}>
                {horse.createdAt ? new Date(horse.createdAt).toLocaleString("en-US") : "—"}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 2: Stable & Care */}
      {activeTab === "stable" && !isOwner && (
        <Card pad={24}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.125rem", fontWeight: 700 }}>
            Stabling & Assigned Caretakers
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ border: "1px solid var(--border, #e2e8f0)", borderRadius: 8, padding: 16 }}>
              <h4 style={{ margin: "0 0 0.75rem 0" }}>Current Stall Assignment</h4>
              <p style={{ margin: "0 0 0.5rem 0" }}>
                <strong>Stall Code:</strong> {horse.stallCode || "Unassigned"}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Barn Zone:</strong> {horse.zone || "Unassigned"}
              </p>
            </div>

            <div style={{ border: "1px solid var(--border, #e2e8f0)", borderRadius: 8, padding: 16 }}>
              <h4 style={{ margin: "0 0 0.75rem 0" }}>Assigned Groom Hand</h4>
              <p style={{ margin: 0 }}>
                <strong>Primary Groom:</strong> {horse.primaryGroom || "Unassigned Groom"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 2 Routine (for owner or routine tab) */}
      {(activeTab === "routine" || (activeTab === "stable" && isOwner)) && (
        <Card pad={24}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.125rem", fontWeight: 700 }}>
            Daily Routine Schedule
          </h3>
          <p style={{ color: "var(--ink-muted, #64748b)" }}>
            Standard Stable Routine: Feed rations (06:00, 11:30, 17:00), Stall mucking & turnout (07:00), Training conditioning (08:00 - 10:00), Hydrotherapy & cryo leg hosing (10:30).
          </p>
        </Card>
      )}

      {/* Tab 3: Ownership */}
      {activeTab === "owner" && (
        <Card pad={24}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
              Ownership & Custody Details
            </h3>
            {isManager && horse.status !== "RETIRED" && (
              <Button size="sm" tone="secondary" onClick={() => setIsOwnerModalOpen(true)}>
                Transfer Ownership
              </Button>
            )}
          </div>
          {horse.owner ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <strong>Horse Owner:</strong> {horse.owner.fullName}
              </div>
              <div>
                <strong>Email Contact:</strong> {horse.owner.email}
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--ink-muted, #64748b)" }}>
              {horse.ownerName ? `Registered Owner: ${horse.ownerName}` : "No registered horse owner associated."}
            </p>
          )}
        </Card>
      )}

      {/* Tab 4: Status History */}
      {activeTab === "status-history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Card pad={24}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
                Status Transition History
              </h3>
              <div>
                Current Status: <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
              </div>
            </div>
            {history?.statusHistory && history.statusHistory.length > 0 ? (
              <DataTable
                caption="Horse status transitions"
                rowKey={(r) => r.id}
                rows={history.statusHistory}
                columns={[
                  {
                    key: "timestamp",
                    header: "Timestamp",
                    render: (r) => new Date(r.timestamp).toLocaleString("en-US"),
                  },
                  {
                    key: "action",
                    header: "Action",
                    render: (r) => <strong>{r.action}</strong>,
                  },
                  {
                    key: "transition",
                    header: "Transition",
                    render: (r) => (
                      <span>
                        {r.oldStatus || "—"} → <Badge tone="info">{r.newStatus || "—"}</Badge>
                      </span>
                    ),
                  },
                  {
                    key: "changedBy",
                    header: "Changed By",
                    render: (r) => r.changedBy || "System",
                  },
                  {
                    key: "notes",
                    header: "Notes / Reason",
                    render: (r) => r.notes || "—",
                  },
                ]}
              />
            ) : (
              <p style={{ color: "var(--ink-muted, #64748b)", margin: 0 }}>
                No recorded status transitions yet. Current status: <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
              </p>
            )}
          </Card>

          {history?.ownershipHistory && history.ownershipHistory.length > 0 && (
            <Card pad={24}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", fontWeight: 700 }}>
                Ownership Transfer History
              </h3>
              <DataTable
                caption="Ownership transfers"
                rowKey={(r) => r.id}
                rows={history.ownershipHistory}
                columns={[
                  {
                    key: "timestamp",
                    header: "Date",
                    render: (r) => new Date(r.timestamp).toLocaleDateString("en-US"),
                  },
                  {
                    key: "previousOwner",
                    header: "Previous Owner",
                    render: (r) => r.previousOwner,
                  },
                  {
                    key: "newOwner",
                    header: "New Owner",
                    render: (r) => <strong>{r.newOwner}</strong>,
                  },
                  {
                    key: "transferredBy",
                    header: "Transferred By",
                    render: (r) => r.transferredBy || "System",
                  },
                  {
                    key: "reason",
                    header: "Reason",
                    render: (r) => r.reason || "—",
                  },
                ]}
              />
            </Card>
          )}
        </div>
      )}

      {/* Tab 5: Stall History */}
      {activeTab === "stall-history" && !isOwner && (
        <Card pad={24}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
              Stall Allocation History
            </h3>
            <div>
              Active Stall: <strong>{horse.stallCode || "Unassigned"}</strong> ({horse.zone || "Unassigned Zone"})
            </div>
          </div>
          {history?.stallHistory && history.stallHistory.length > 0 ? (
            <DataTable
              caption="Stall allocation records"
              rowKey={(r) => r.id}
              rows={history.stallHistory}
              columns={[
                {
                  key: "stallCode",
                  header: "Stall Code",
                  render: (r) => <strong>{r.stallCode}</strong>,
                },
                {
                  key: "zone",
                  header: "Zone / Barn",
                  render: (r) => r.zone,
                },
                {
                  key: "groomName",
                  header: "Assigned Groom",
                  render: (r) => r.groomName || "Unassigned",
                },
                {
                  key: "dates",
                  header: "Period",
                  render: (r) => (
                    <span>
                      {new Date(r.startDate).toLocaleDateString("en-US")} –{" "}
                      {r.endDate ? new Date(r.endDate).toLocaleDateString("en-US") : "Present"}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => (
                    <Badge tone={r.isActive ? "ok" : "neutral"}>
                      {r.isActive ? "Active" : "Historical"}
                    </Badge>
                  ),
                },
              ]}
            />
          ) : (
            <p style={{ color: "var(--ink-muted, #64748b)", margin: 0 }}>
              No historical stall allocation records logged.
            </p>
          )}
        </Card>
      )}

      {/* Tab 6: Lifecycle Timeline */}
      {activeTab === "timeline" && (
        <Card pad={24}>
          <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.125rem", fontWeight: 700 }}>
            Lifecycle Activity Timeline
          </h3>
          {history?.timeline && history.timeline.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {history.timeline.map((evt) => {
                const getCategoryIcon = (category: string) => {
                  switch (category) {
                    case "IDENTITY": return "📋";
                    case "STATUS": return "🔄";
                    case "STALL": return "🏠";
                    case "MEDICAL": return "🩺";
                    case "TRAINING": return "🏃";
                    case "TOURNAMENT": return "🏆";
                    case "OWNERSHIP": return "🤝";
                    default: return "📌";
                  }
                };
                return (
                  <div key={evt.id} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-subtle, #f1f5f9)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-subtle, #e2e8f0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.125rem", flexShrink: 0 }}>
                      {getCategoryIcon(evt.category)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <strong style={{ fontSize: "0.9375rem" }}>{evt.title}</strong>
                          {evt.badgeTone && (
                            <Badge tone={evt.badgeTone}>{evt.category}</Badge>
                          )}
                        </div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--ink-muted, #64748b)" }}>
                          {new Date(evt.timestamp).toLocaleString("en-US")}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--ink-secondary, #334155)", marginTop: "0.25rem" }}>
                        {evt.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  📋
                </div>
                <div>
                  <strong>Horse identity profile created</strong>
                  <div style={{ fontSize: "0.8125rem", color: "var(--ink-muted, #64748b)" }}>
                    {horse.createdAt ? new Date(horse.createdAt).toLocaleString("en-US") : "System"} · Horse ID {horse.horseCode || horse.id}
                  </div>
                </div>
              </div>
              {horse.isMedicalLocked && (
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    🔒
                  </div>
                  <div>
                    <strong>Veterinary Medical Lock enforced</strong>
                    <div style={{ fontSize: "0.8125rem", color: "var(--ink-muted, #64748b)" }}>
                      High-intensity conditioning and race trials suspended
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Governance Modals for Club Manager */}
      <AssignOwnerModal
        horse={horse}
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        onSuccess={refreshHorse}
      />

      <DeleteHorseModal
        horse={horse}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={refreshHorse}
      />
    </div>
  );
}
