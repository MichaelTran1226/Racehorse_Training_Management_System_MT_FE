import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { HealthBadge } from "@/shared/components/ui/HealthBadge";
import { Icon } from "@/shared/components/ui/Icon";
import { Tabs } from "@/shared/components/ui/Tabs";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { cx } from "@/shared/lib/cx";
import {
  getHorseMedicalProfile,
  getHorseObservations,
  applyTrainingLock,
  releaseTrainingLock,
  extendTrainingLock,
} from "../api";
import { TrainingLockModal } from "../components/TrainingLockModal";
import { VitalsDisplay } from "../components/VitalsDisplay";
import type { HorseMedicalProfile, ObservationNote } from "../types";
import styles from "./MedicalRecordPage.module.css";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "records", label: "Medical Records" },
  { id: "injuries", label: "Injury Map" },
  { id: "locks", label: "Training Locks" },
  { id: "preventive", label: "Preventive Care" },
  { id: "observations", label: "Observations" },
];

export default function MedicalRecordPage() {
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState<HorseMedicalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Observation filters
  const [obsUrgency, setObsUrgency] = useState<string>("");
  const [observations, setObservations] = useState<ObservationNote[]>([]);

  // Lock modal states
  const [lockModalMode, setLockModalMode] = useState<"place" | "lift" | "extend" | null>(null);

  const isVet = user?.role === "VETERINARIAN";
  const isOwner = user?.role === "HORSE_OWNER";
  const isGroom = user?.role === "GROOM";

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getHorseMedicalProfile(id);
      setProfile(res);
      setObservations(res.observations || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load horse medical profile.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Load observations with filter
  async function handleFilterObservations(urgency: string) {
    setObsUrgency(urgency);
    if (!id) return;
    try {
      const res = await getHorseObservations(id, { urgency: urgency || undefined });
      setObservations(res.observations);
    } catch {
      toast.show("Error filtering observation notes.", "danger");
    }
  }

  function handleTabChange(tabId: string) {
    setSearchParams({ tab: tabId });
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
          Loading medical profile...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <EmptyState
          title="Unable to load medical profile"
          description={error || "Data not found or you lack permission to view this horse's profile."}
          action={
            <Button tone="primary" onClick={() => void loadData()}>
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  const { horse, overview, records, injuries, locks, preventive } = profile;

  return (
    <div className={styles.container}>
      {/* Header Profile */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <div className={styles.titleRow}>
              <h1 className={styles.horseTitle}>{horse.name}</h1>
              <HealthBadge status={horse.healthStatus} withIcon />
              {horse.isMedicalLocked && (
                <Badge tone="danger" icon="lock">
                  Active Training Lock
                </Badge>
              )}
            </div>
            <div className={styles.horseMeta}>
              <span className={styles.metaItem}>
                <Icon name="pin" size={14} /> Microchip RFID: <strong>{horse.microchipRfid}</strong>
              </span>
              <span className={styles.metaItem}>
                <Icon name="horse" size={14} /> Breed: <strong>{horse.breed}</strong>
              </span>
              <span className={styles.metaItem}>
                <Icon name="grid" size={14} /> Stall: <strong>{horse.stallCode || "Unassigned"}</strong>
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            {isVet && (
              <>
                <Button
                  tone="primary"
                  icon="plus"
                  onClick={() => navigate(`/medical/records/new?horseId=${horse.id}`)}
                >
                  Create Medical Record
                </Button>

                {!horse.isMedicalLocked ? (
                  <Button tone="danger" icon="lock" onClick={() => setLockModalMode("place")}>
                    Place Training Lock
                  </Button>
                ) : (
                  <>
                    <Button tone="ghost" icon="clock" onClick={() => setLockModalMode("extend")}>
                      Extend Review Date
                    </Button>
                    <Button tone="primary" icon="unlock" onClick={() => setLockModalMode("lift")}>
                      Lift Training Lock
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Lock Banner Warning */}
        {horse.isMedicalLocked && horse.activeLock && (
          <div className={styles.lockAlert}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="alert" size={20} />
              <div>
                <strong>ACTIVE TRAINING LOCK ORDER IN FORCE ({horse.activeLock.lockCode})</strong>
                <div>
                  Reason: {horse.activeLock.lockReason} · Placed by: {horse.activeLock.lockedBy} (
                  {new Date(horse.activeLock.lockedAt).toLocaleDateString("en-US")})
                </div>
              </div>
            </div>
            <div>
              Review Date: <strong>{new Date(horse.activeLock.reviewDate).toLocaleDateString("en-US")}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs items={TABS} active={activeTab} onChange={handleTabChange} />

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className={styles.tabContent}>
          <div className={styles.overviewGrid}>
            {/* Activity Level & Directives */}
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <Icon name="activity" size={18} />
                Activity Level & Care Directives
              </h2>
              <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  Allowed activity level:{" "}
                  <Badge tone="brand">
                    {overview.allowedActivity || "Normal"}
                  </Badge>
                </div>
                <div>
                  Special care instructions:
                  {overview.careInstructions.length === 0 ? (
                    <div style={{ color: "var(--muted)", marginTop: 4 }}>No special directives.</div>
                  ) : (
                    <ul style={{ margin: "6px 0 0 18px", padding: 0, color: "var(--text-2)" }}>
                      {overview.careInstructions.map((c, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>
                          <strong>{c.activity}</strong> — {c.frequency}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Active Medications (Hidden from Owner & Groom per FR-3.18) */}
            {!isOwner && !isGroom && (
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>
                  <Icon name="pill" size={18} />
                  Active Medications
                </h2>
                {overview.activeMedications.length === 0 ? (
                  <div style={{ color: "var(--muted)", fontSize: "13px" }}>Currently no active medications.</div>
                ) : (
                  <div className={styles.tableContainer}>
                    <table className={styles.dataTable}>
                      <thead>
                        <tr>
                          <th>Medication</th>
                          <th>Dosage</th>
                          <th>Route</th>
                          <th>Frequency</th>
                          <th>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.activeMedications.map((m, i) => (
                          <tr key={i}>
                            <td><strong>{m.medicationName}</strong></td>
                            <td>{m.dosage} {m.unit}</td>
                            <td>{m.route}</td>
                            <td>{m.frequencyPerDay} times/day</td>
                            <td>{m.daysCount} days</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vital Signs */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <Icon name="pulse" size={18} />
              Latest Vital Signs & History
            </h2>
            <VitalsDisplay
              vitals={overview.latestVitals}
              history={overview.vitalsHistory}
              recordedAt={overview.latestVitals?.recordedAt}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Medical Records */}
      {activeTab === "records" && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className={styles.sectionTitle}>
                <Icon name="clipboard" size={18} />
                Medical Record History
              </h2>
              {isVet && (
                <Button size="sm" tone="primary" icon="plus" onClick={() => navigate(`/medical/records/new?horseId=${horse.id}`)}>
                  Add Record
                </Button>
              )}
            </div>

            {records.length === 0 ? (
              <EmptyState title="No medical records found" description="No clinical records currently documented for this horse." />
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Record No.</th>
                      <th>Exam Date</th>
                      <th>Exam Type</th>
                      <th>Diagnosis</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Attending Vet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id} onClick={() => navigate(`/medical/records/${r.id}`)}>
                        <td>
                          <strong>{r.recordNumber}</strong>
                        </td>
                        <td>{new Date(r.examinationDate).toLocaleDateString("en-US")}</td>
                        <td>{r.examinationType}</td>
                        <td>{r.diagnosis || "None"}</td>
                        <td>
                          <Badge tone={r.severity === "CRITICAL" || r.severity === "SEVERE" ? "danger" : "ok"}>
                            {r.severity || "—"}
                          </Badge>
                        </td>
                        <td>
                          <Badge tone={r.status === "OPEN" ? "info" : r.status === "CLOSED" ? "ok" : "neutral"} dot>
                            {r.status === "OPEN" ? "In Treatment" : r.status === "CLOSED" ? "Closed" : "Draft"}
                          </Badge>
                        </td>
                        <td>{r.vetName || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Injury Map */}
      {activeTab === "injuries" && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className={styles.sectionTitle}>
                <Icon name="bone" size={18} />
                Injury List & Anatomical Lesions
              </h2>
              <Button size="sm" tone="ghost" icon="map" onClick={() => navigate(`/medical/horses/${horse.id}/injuries`)}>
                Open 2D Model
              </Button>
            </div>

            {injuries.length === 0 ? (
              <EmptyState title="No injuries recorded" description="No musculoskeletal lesions currently documented for this horse." />
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Anatomical Region</th>
                      <th>Injury Type</th>
                      <th>Severity</th>
                      <th>Stage</th>
                      <th>Detected Date</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {injuries.map((inj) => (
                      <tr key={inj.id}>
                        <td><strong>{inj.region}</strong> ({inj.view === "LEFT" ? "Left View" : "Right View"})</td>
                        <td>{inj.injuryType}</td>
                        <td>
                          <Badge tone={inj.severity === "SEVERE" || inj.severity === "CRITICAL" ? "danger" : "warn"}>
                            {inj.severity}
                          </Badge>
                        </td>
                        <td>
                          <Badge tone={inj.stage === "ACUTE" ? "danger" : inj.stage === "HEALED" ? "ok" : "warn"} dot>
                            {inj.stage === "ACUTE" ? "Acute" : inj.stage === "SUBACUTE" ? "Subacute" : inj.stage === "RECOVERING" ? "Recovering" : "Healed"}
                          </Badge>
                        </td>
                        <td>{new Date(inj.detectedDate).toLocaleDateString("en-US")}</td>
                        <td>{inj.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Training Locks */}
      {activeTab === "locks" && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <Icon name="lock" size={18} />
              Training Lock History
            </h2>

            {locks.length === 0 ? (
              <EmptyState title="No training locks on record" description="This horse has no training lock orders on record." />
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Lock Code</th>
                      <th>Applied Status</th>
                      <th>Placed Date</th>
                      <th>Placed By</th>
                      <th>Reason</th>
                      <th>Review Date</th>
                      <th>Lifted Date</th>
                      <th>Release Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locks.map((lk) => (
                      <tr key={lk.id}>
                        <td><strong>{lk.lockCode}</strong></td>
                        <td><Badge tone="danger">{lk.appliedMedicalStatus}</Badge></td>
                        <td>{new Date(lk.lockedAt).toLocaleDateString("en-US")}</td>
                        <td>{lk.lockedBy}</td>
                        <td>{lk.lockReason}</td>
                        <td>{new Date(lk.reviewDate).toLocaleDateString("en-US")}</td>
                        <td>{lk.releasedAt ? new Date(lk.releasedAt).toLocaleDateString("en-US") : "Active"}</td>
                        <td>{lk.releaseReason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Preventive Care */}
      {activeTab === "preventive" && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <Icon name="calendar" size={18} />
              Vaccination, Deworming & Farrier Schedule
            </h2>

            {preventive.length === 0 ? (
              <EmptyState title="No preventive schedules" description="No preventive care catalog set up for this horse." />
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Category</th>
                      <th>Last Administered</th>
                      <th>Administered By</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preventive.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.type}</strong></td>
                        <td>{p.category}</td>
                        <td>{p.lastAdministeredDate ? new Date(p.lastAdministeredDate).toLocaleDateString("en-US") : "—"}</td>
                        <td>{p.administeredBy || "—"}</td>
                        <td>{new Date(p.dueDate).toLocaleDateString("en-US")}</td>
                        <td>
                          <Badge tone={p.status === "OVERDUE" ? "danger" : p.status === "DUE_SOON" ? "warn" : "ok"} dot>
                            {p.status === "OVERDUE" ? "Overdue" : p.status === "DUE_SOON" ? "Due Soon" : "Up to Date"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Observations */}
      {activeTab === "observations" && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <h2 className={styles.sectionTitle}>
                <Icon name="eye" size={18} />
                Groom Health Observation Log
              </h2>

              <div className={styles.filtersRow}>
                <span style={{ fontSize: "13px", color: "var(--muted)" }}>Urgency:</span>
                <Button
                  size="sm"
                  tone={obsUrgency === "" ? "primary" : "ghost"}
                  onClick={() => void handleFilterObservations("")}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  tone={obsUrgency === "NORMAL" ? "primary" : "ghost"}
                  onClick={() => void handleFilterObservations("NORMAL")}
                >
                  Normal
                </Button>
                <Button
                  size="sm"
                  tone={obsUrgency === "ATTENTION" ? "primary" : "ghost"}
                  onClick={() => void handleFilterObservations("ATTENTION")}
                >
                  Attention
                </Button>
                <Button
                  size="sm"
                  tone={obsUrgency === "URGENT" ? "danger" : "ghost"}
                  onClick={() => void handleFilterObservations("URGENT")}
                >
                  Urgent
                </Button>
              </div>
            </div>

            {observations.length === 0 ? (
              <EmptyState title="No observation notes" description="No observation logs submitted by care staff." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {observations.map((o) => (
                  <div key={o.id} className={cx(styles.observationItem, o.urgency === "URGENT" && styles.urgent)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <strong>{o.groomName}</strong>
                        <span style={{ fontSize: "12px", color: "var(--muted)" }}>({o.shift})</span>
                        <Badge tone={o.urgency === "URGENT" ? "danger" : o.urgency === "ATTENTION" ? "warn" : "neutral"} dot>
                          {o.urgency === "URGENT" ? "Urgent" : o.urgency === "ATTENTION" ? "Attention" : "Normal"}
                        </Badge>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                        {new Date(o.observedAt).toLocaleString("en-US")}
                      </span>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text)" }}>{o.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lock Action Modals */}
      {lockModalMode && (
        <TrainingLockModal
          mode={lockModalMode}
          horseName={horse.name}
          horseId={horse.id}
          currentReviewDate={horse.activeLock?.reviewDate}
          onClose={() => setLockModalMode(null)}
          onPlaceLock={async (dto) => {
            await applyTrainingLock(horse.id, {
              appliedMedicalStatus: dto.appliedStatus,
              lockReason: dto.reason,
              reviewDate: dto.reviewDate,
              unlockConditions: dto.unlockConditions,
            });
            toast.show("Training lock placed successfully", "ok");
            await loadData();
          }}
          onLiftLock={async (dto) => {
            const lockId = horse.activeLock?.id || horse.id;
            await releaseTrainingLock(lockId, {
              targetStatus: dto.restoreStatus,
              releaseReason: dto.reason,
              horseId: horse.id,
            });
            toast.show(
              `Training lock lifted successfully. Status restored to ${dto.restoreStatus === "FIT" ? "Fit for Training" : "Under Observation"}`,
              "ok",
            );
            await loadData();
          }}
          onExtendLock={async (dto) => {
            const lockId = horse.activeLock?.id || horse.id;
            await extendTrainingLock(lockId, {
              newReviewDate: dto.newReviewDate,
              reason: dto.reason,
              horseId: horse.id,
            });
            toast.show(`Training lock review date extended to ${dto.newReviewDate}`, "ok");
            await loadData();
          }}
        />
      )}
    </div>
  );
}
