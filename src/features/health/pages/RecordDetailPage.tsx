import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Icon } from "@/shared/components/ui/Icon";
import { Tabs } from "@/shared/components/ui/Tabs";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import {
  addFollowUp,
  addPrescription,
  addTreatmentPhase,
  closeRecord,
  deleteDraftRecord,
  finalizeRecord,
  getRecordDetail,
  reopenRecord,
  stopPrescription,
} from "../api";
import { AddFollowUpModal } from "../components/AddFollowUpModal";
import { AddPrescriptionModal } from "../components/AddPrescriptionModal";
import { AddTreatmentPhaseModal } from "../components/AddTreatmentPhaseModal";
import { CloseRecordModal } from "../components/CloseRecordModal";
import { FinalizeRecordModal } from "../components/FinalizeRecordModal";
import { StopPrescriptionModal } from "../components/StopPrescriptionModal";
import { VitalsDisplay } from "../components/VitalsDisplay";
import type { MedicalRecord, PrescriptionItem } from "../types";
import styles from "./MedicalRecordPage.module.css";

const RECORD_TABS = [
  { id: "diagnosis", label: "Exam & Diagnosis" },
  { id: "phases", label: "Treatment Protocol" },
  { id: "prescriptions", label: "Prescriptions" },
  { id: "followups", label: "Follow-ups" },
];

export default function RecordDetailPage() {
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "diagnosis";
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [stoppingPrescription, setStoppingPrescription] = useState<PrescriptionItem | null>(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const isVet = user?.role === "VETERINARIAN";
  const isOwner = user?.role === "HORSE_OWNER";

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getRecordDetail(id);
      setRecord(res.record);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load medical record details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  async function handleDeleteDraft() {
    if (!record || !window.confirm(`Delete draft medical record ${record.recordNumber}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteDraftRecord(record.id);
      toast.show("Draft medical record deleted.", "ok");
      navigate(`/medical/horses/${record.horseId}`);
    } catch {
      toast.show("Failed to delete draft record.", "danger");
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
          Loading medical record details...
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className={styles.container}>
        <EmptyState
          title="Medical record not found"
          description={error || "This record does not exist or you lack permission to view it."}
          action={
            <Button tone="primary" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          }
        />
      </div>
    );
  }

  const isDraft = record.status === "DRAFT";
  const isOpen = record.status === "OPEN";
  const isClosed = record.status === "CLOSED";

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <div className={styles.titleRow}>
              <h1 className={styles.horseTitle}>Medical Record {record.recordNumber}</h1>
              <Badge
                tone={isOpen ? "info" : isClosed ? "ok" : "neutral"}
                dot
              >
                {isOpen ? "In Treatment" : isClosed ? "Closed" : "Draft"}
              </Badge>
              {record.severity && (
                <Badge
                  tone={
                    record.severity === "CRITICAL" || record.severity === "SEVERE"
                      ? "danger"
                      : record.severity === "MODERATE"
                      ? "warn"
                      : "ok"
                  }
                >
                  Severity: {record.severity}
                </Badge>
              )}
            </div>

            <div className={styles.horseMeta}>
              <span className={styles.metaItem}>
                <Icon name="horse" size={14} /> Horse:{" "}
                <Link to={`/medical/horses/${record.horseId}`} style={{ color: "var(--brand)", fontWeight: 600 }}>
                  {record.horseName || record.horseId}
                </Link>
              </span>
              <span className={styles.metaItem}>
                <Icon name="calendar" size={14} /> Exam Date:{" "}
                <strong>{new Date(record.examinationDate).toLocaleDateString("en-US")}</strong>
              </span>
              <span className={styles.metaItem}>
                <Icon name="user" size={14} /> Attending Vet: <strong>{record.vetName || "Dr. Sarah Connor"}</strong>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className={styles.actions}>
            {isVet && isDraft && (
              <>
                <Button tone="ghost" icon="edit" onClick={() => navigate(`/medical/records/${record.id}/edit`)}>
                  Edit Record
                </Button>
                <Button tone="danger" icon="trash" onClick={() => void handleDeleteDraft()}>
                  Delete Draft
                </Button>
                <Button tone="primary" icon="checkCircle" onClick={() => setShowFinalizeModal(true)}>
                  Finalize Record
                </Button>
              </>
            )}

            {isVet && isOpen && (
              <>
                <Button tone="primary" icon="checkCircle" onClick={() => setShowCloseModal(true)}>
                  Conclude Treatment
                </Button>
              </>
            )}

            {isVet && isClosed && (
              <Button tone="ghost" icon="refresh" onClick={() => setShowCloseModal(true)}>
                Reopen Record
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        items={isOwner ? RECORD_TABS.filter((t) => t.id !== "prescriptions") : RECORD_TABS}
        active={activeTab}
        onChange={(tabId) => setSearchParams({ tab: tabId })}
      />

      {/* Tab 1: Exam & Diagnosis */}
      {activeTab === "diagnosis" && (
        <div className={styles.tabContent}>
          {/* Exam info */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <Icon name="clipboard" size={18} />
              Clinical Examination Information
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, fontSize: "14px" }}>
              <div>
                <span style={{ color: "var(--muted)" }}>Exam Type:</span> <strong>{record.examinationType}</strong>
              </div>
              <div>
                <span style={{ color: "var(--muted)" }}>Discovery Source:</span>{" "}
                <strong>{record.discoverySource || "VET Self-Discovered"}</strong>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "var(--muted)" }}>Reason for Examination:</span>{" "}
                <div style={{ marginTop: 4, padding: "8px 12px", background: "var(--surface-2)", borderRadius: "6px" }}>
                  {record.examinationReason}
                </div>
              </div>
              {record.symptoms && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={{ color: "var(--muted)" }}>Clinical Symptoms:</span>{" "}
                  <div style={{ marginTop: 4, padding: "8px 12px", background: "var(--surface-2)", borderRadius: "6px" }}>
                    {record.symptoms}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vitals at exam */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <Icon name="pulse" size={18} />
              Vital Signs at Examination
            </h2>
            <VitalsDisplay vitals={record.vitals} />
          </div>

          {/* Diagnostics / Lab tests */}
          {record.labTests && record.labTests.length > 0 && (
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <Icon name="file" size={18} />
                Diagnostic & Lab Test Results (Imaging & Pathology)
              </h2>
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Test Modality</th>
                      <th>Date Administered</th>
                      <th>Findings & Findings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.labTests.map((t, idx) => (
                      <tr key={idx}>
                        <td><strong>{t.testType}</strong></td>
                        <td>{new Date(t.testDate).toLocaleDateString("en-US")}</td>
                        <td>{t.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Diagnosis & Prognosis */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <Icon name="stethoscope" size={18} />
              Definitive Diagnosis & Prognosis
            </h2>
            <div style={{ fontSize: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "6px", fontSize: "15px" }}>
                <strong>Diagnosis:</strong> {record.diagnosis || "No detailed diagnosis recorded"}
              </div>

              {record.conclusion && (
                <div style={{ padding: "12px", background: "var(--ok-bg)", border: "1px solid var(--ok)", borderRadius: "6px" }}>
                  <strong style={{ color: "var(--ok)" }}>Treatment Conclusion:</strong> {record.conclusion}
                  {record.treatmentResult && (
                    <div style={{ marginTop: 6 }}>
                      Outcome: <strong>{record.treatmentResult}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Treatment Protocol */}
      {activeTab === "phases" && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className={styles.sectionTitle}>
                <Icon name="activity" size={18} />
                Treatment Phases & Protocol
              </h2>
              {isVet && isOpen && (
                <Button size="sm" tone="primary" icon="plus" onClick={() => setShowPhaseModal(true)}>
                  Add Phase
                </Button>
              )}
            </div>

            {!record.treatmentPhases || record.treatmentPhases.length === 0 ? (
              <EmptyState
                title="No treatment protocol established"
                description="No rehabilitation phases have been configured for this medical record."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {record.treatmentPhases.map((phase, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "16px",
                      background: "var(--surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{phase.phaseName}</strong>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                        {new Date(phase.startDate).toLocaleDateString("en-US")} —{" "}
                        {new Date(phase.endDate).toLocaleDateString("en-US")}
                      </span>
                    </div>

                    <div style={{ fontSize: "13px" }}>
                      Activity: <Badge tone="brand">{phase.allowedActivity}</Badge> · Objective: {phase.target}
                    </div>

                    {phase.careInstructions.length > 0 && (
                      <div style={{ fontSize: "13px", marginTop: 4 }}>
                        <span style={{ color: "var(--muted)" }}>Care Directives:</span>
                        <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                          {phase.careInstructions.map((c, i) => (
                            <li key={i}>
                              <strong>{c.activity}</strong> ({c.frequency})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Prescriptions */}
      {activeTab === "prescriptions" && !isOwner && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className={styles.sectionTitle}>
                <Icon name="pill" size={18} />
                Prescriptions & Medication Schedule
              </h2>
              {isVet && isOpen && (
                <Button size="sm" tone="primary" icon="plus" onClick={() => setShowPrescriptionModal(true)}>
                  Prescribe Medication
                </Button>
              )}
            </div>

            {!record.prescriptions || record.prescriptions.length === 0 ? (
              <EmptyState title="No prescriptions recorded" description="No medications prescribed in this record." />
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
                      <th>Total Dispensed</th>
                      <th>Pre-Race Withdrawal</th>
                      <th>Status</th>
                      {isVet && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {record.prescriptions.map((rx) => (
                      <tr key={rx.id}>
                        <td><strong>{rx.medicationName}</strong></td>
                        <td>{rx.dosage} {rx.unit}</td>
                        <td>{rx.route}</td>
                        <td>{rx.frequencyPerDay} times/day</td>
                        <td>{rx.daysCount} days</td>
                        <td>{rx.dosage * rx.frequencyPerDay * rx.daysCount} {rx.unit}</td>
                        <td>
                          {rx.withdrawalDays ? `${rx.withdrawalDays} days` : "—"}
                        </td>
                        <td>
                          <Badge tone={rx.status === "ACTIVE" ? "info" : rx.status === "COMPLETED" ? "ok" : "neutral"} dot>
                            {rx.status === "ACTIVE" ? "Active" : rx.status === "COMPLETED" ? "Completed" : "Discontinued"}
                          </Badge>
                        </td>
                        {isVet && (
                          <td>
                            {rx.status === "ACTIVE" && (
                              <Button
                                size="sm"
                                tone="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStoppingPrescription(rx);
                                }}
                              >
                                Discontinue
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Follow-ups */}
      {activeTab === "followups" && (
        <div className={styles.tabContent}>
          <div className={styles.sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className={styles.sectionTitle}>
                <Icon name="clock" size={18} />
                Follow-up Examination History
              </h2>
              {isVet && isOpen && (
                <Button size="sm" tone="primary" icon="plus" onClick={() => setShowFollowUpModal(true)}>
                  Add Follow-up
                </Button>
              )}
            </div>

            {!record.followUps || record.followUps.length === 0 ? (
              <EmptyState title="No follow-up exams recorded" description="Record follow-up examinations to track healing progression." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {record.followUps.map((fu, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "14px 16px",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      background: "var(--surface)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>Follow-up Exam #{idx + 1}</span>
                      <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                        {new Date(fu.followUpDate).toLocaleString("en-US")}
                      </span>
                    </div>

                    <div style={{ fontSize: "13px", color: "var(--text-2)" }}>
                      Temperature: <strong>{fu.temperature}°C</strong> · Heart Rate: <strong>{fu.restingHeartRate} bpm</strong> · Respiratory Rate: <strong>{fu.respiratoryRate} breaths/min</strong>
                    </div>

                    <div style={{ fontSize: "13px" }}>
                      <strong>Clinical Progress:</strong> {fu.progressNotes}
                    </div>

                    {fu.adjustments && (
                      <div style={{ fontSize: "13px", color: "var(--brand)" }}>
                        <strong>Protocol Adjustments:</strong> {fu.adjustments}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showFinalizeModal && (
        <FinalizeRecordModal
          recordNumber={record.recordNumber}
          proposedStatus={record.proposedStatus}
          initialProposeLock={record.proposeMedicalLock}
          onClose={() => setShowFinalizeModal(false)}
          onFinalize={async (input) => {
            await finalizeRecord(record.id, input);
            toast.show("Medical record finalized and transitioned to In Treatment status.", "ok");
            await fetchDetail();
          }}
        />
      )}

      {showPhaseModal && (
        <AddTreatmentPhaseModal
          onClose={() => setShowPhaseModal(false)}
          onSubmit={async (input) => {
            await addTreatmentPhase(record.id, input);
            toast.show("Treatment phase added successfully.", "ok");
            await fetchDetail();
          }}
        />
      )}

      {showPrescriptionModal && (
        <AddPrescriptionModal
          onClose={() => setShowPrescriptionModal(false)}
          onSubmit={async (input) => {
            await addPrescription(record.id, input);
            toast.show("Prescription added successfully.", "ok");
            await fetchDetail();
          }}
        />
      )}

      {stoppingPrescription && (
        <StopPrescriptionModal
          medicationName={stoppingPrescription.medicationName}
          onClose={() => setStoppingPrescription(null)}
          onSubmit={async (input) => {
            await stopPrescription(record.id, stoppingPrescription.id!, input);
            toast.show("Medication discontinued successfully.", "ok");
            await fetchDetail();
          }}
        />
      )}

      {showFollowUpModal && (
        <AddFollowUpModal
          onClose={() => setShowFollowUpModal(false)}
          onSubmit={async (input) => {
            await addFollowUp(record.id, input);
            toast.show("Follow-up examination recorded successfully.", "ok");
            await fetchDetail();
          }}
        />
      )}

      {showCloseModal && (
        <CloseRecordModal
          recordNumber={record.recordNumber}
          isClosed={isClosed}
          onClose={() => setShowCloseModal(false)}
          onConfirmClose={async (conclusion, treatmentResult) => {
            await closeRecord(record.id, { conclusion, treatmentResult });
            toast.show("Treatment concluded and record closed successfully.", "ok");
            await fetchDetail();
          }}
          onConfirmReopen={async (reopenReason) => {
            await reopenRecord(record.id, { reopenReason });
            toast.show("Medical record reopened successfully.", "ok");
            await fetchDetail();
          }}
        />
      )}
    </div>
  );
}
