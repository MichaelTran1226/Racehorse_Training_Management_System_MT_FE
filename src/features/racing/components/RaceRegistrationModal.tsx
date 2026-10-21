import { useState, useEffect } from "react";
import { Modal } from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { tr, isVietnamese } from "@/shared/i18n/tr";
import { useAppLanguage } from "@/shared/lib/language";
import { fetchEligibility, registerHorseForRace } from "../api";
import type { EligibilityResponse, Tournament } from "../types";

function formatIneligibleReason(reason: string, isVi: boolean): string {
  if (!isVi) return reason;

  // 1. Khóa y tế
  if (/veterinary medical lock/i.test(reason)) {
    return "Đang bị Khóa y tế thú y (Cấm xuất chuồng / Cấm thi đấu)";
  }

  // 2. Trạng thái sức khỏe
  if (/Horse health status is (currently\s+)?(\w+)/i.test(reason)) {
    const match = reason.match(/Horse health status is (currently\s+)?(\w+)/i);
    const code = match ? match[2].toUpperCase() : "";
    const map: Record<string, string> = {
      ISOLATED: "Đang cách ly kiểm dịch y tế (ISOLATED)",
      INJURED: "Đang điều trị chấn thương (INJURED)",
      UNDER_OBSERVATION: "Đang theo dõi sức khỏe đặc biệt (UNDER_OBSERVATION)",
      SICK: "Đang bị bệnh / trị liệu (SICK)",
      RESTING: "Đang nghỉ dưỡng phục hồi (RESTING)",
      RETIRED: "Đã giải nghệ (RETIRED)",
    };
    return `Tình trạng sức khỏe: ${map[code] || code}`;
  }

  // 3. Thiếu số buổi tập gần đây
  const workoutMatch = reason.match(/Insufficient recent training sessions \((\d+)\/(\d+) required in past (\d+) days\)/i);
  if (workoutMatch) {
    const [, curr, req, days] = workoutMatch;
    return `Chưa đủ thể lực thi đấu (Mới hoàn thành ${curr}/${req} buổi tập yêu cầu trong ${days} ngày qua)`;
  }

  if (/insufficient recent training/i.test(reason)) {
    return "Chưa hoàn thành đủ các bài tập chuẩn bị thi đấu";
  }

  return reason;
}

interface RaceRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  onSuccess: () => void;
}

export function RaceRegistrationModal({
  isOpen,
  onClose,
  tournament,
  onSuccess,
}: RaceRegistrationModalProps) {
  useAppLanguage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<EligibilityResponse | null>(null);
  const [selectedHorseId, setSelectedHorseId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tournament) {
      loadEligibility();
    }
  }, [isOpen, tournament]);

  async function loadEligibility() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEligibility(tournament.id);
      setData(res);
      // Auto select first eligible horse if not already registered
      const firstAvailable = res.eligible.find((h) => !h.isRegistered);
      if (firstAvailable) {
        setSelectedHorseId(firstAvailable.id);
      }
    } catch (err: any) {
      setError(err?.message || tr("Failed to load race eligibility"));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!selectedHorseId) {
      setError(tr("Please select an eligible horse to register"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await registerHorseForRace(tournament.id, selectedHorseId, notes.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || tr("Failed to register horse for tournament"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <Modal
      title={tr("Register Horse for Tournament")}
      subtitle={`${tournament.name} · ${tournament.distanceMeters}m (${tr(tournament.trackType)})`}
      width={680}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <span style={{ fontSize: "var(--fs-xs, 0.75rem)", color: "var(--muted)" }}>
            {tr("Deadline:")} {new Date(tournament.registrationDeadline).toLocaleDateString()}
          </span>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Button tone="secondary" onClick={onClose} disabled={submitting}>
              {tr("Cancel")}
            </Button>
            <Button
              tone="primary"
              onClick={handleRegister}
              disabled={submitting || !selectedHorseId}
            >
              {submitting ? tr("Registering...") : tr("Confirm Registration")}
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "var(--danger-bg, #fef2f2)",
              color: "var(--danger, #dc2626)",
              borderRadius: "var(--r-sm, 6px)",
              fontSize: "var(--fs-sm, 0.875rem)",
              border: "1px solid var(--danger-border, #fecaca)",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>
            {tr("Screening club herd for medical locks, withdrawal dates, and workout fitness...")}
          </div>
        ) : data ? (
          <>
            {/* Section 1: Eligible Horses */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h4 style={{ margin: 0, fontSize: "var(--fs-base, 1rem)", fontWeight: 700, color: "var(--ink)" }}>
                  {tr("Eligible Horses")} ({data.eligible.length})
                </h4>
                <Badge tone="ok">{tr("Safe to Compete")}</Badge>
              </div>

              {data.eligible.length === 0 ? (
                <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--muted)", fontStyle: "italic" }}>
                  {tr("No horses currently meet the safe ACWR and medical requirements for this distance.")}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "220px", overflowY: "auto", paddingRight: "0.25rem" }}>
                  {data.eligible.map((h) => {
                    const isSelected = selectedHorseId === h.id;
                    return (
                      <div
                        key={h.id}
                        onClick={() => {
                          if (!h.isRegistered) setSelectedHorseId(h.id);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0.75rem 1rem",
                          borderRadius: "var(--r-md, 8px)",
                          border: isSelected ? "2px solid var(--brand, #10b981)" : "1px solid var(--border)",
                          background: isSelected ? "var(--brand-muted, rgba(16, 185, 129, 0.08))" : "var(--surface)",
                          cursor: h.isRegistered ? "default" : "pointer",
                          opacity: h.isRegistered ? 0.7 : 1,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <input
                            type="radio"
                            name="selectedHorse"
                            checked={isSelected}
                            disabled={h.isRegistered}
                            onChange={() => setSelectedHorseId(h.id)}
                            style={{ cursor: "pointer" }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--ink)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              {h.name}
                              <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", fontWeight: 400 }}>
                                #{h.horseCode || "N/A"}
                              </span>
                            </div>
                            <div style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
                              {h.breed} · {tr("Workouts completed in last 30d:")} {h.completedWorkouts}
                            </div>
                          </div>
                        </div>

                        <div>
                          {h.isRegistered ? (
                            <Badge tone="info">{tr("Already Registered")}</Badge>
                          ) : (
                            <Badge tone="ok">{tr("Ready")}</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tactical Notes Input */}
            {selectedHorseId && (
              <div>
                <label style={{ display: "block", fontSize: "var(--fs-sm, 0.875rem)", fontWeight: 600, marginBottom: "0.375rem" }}>
                  {tr("Tactical Instructions & Jockey Assignment")}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={tr("e.g. Assigned Jockey: Nguyen Van A, maintain mid-pack pacing until 400m bend.")}
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "var(--r-sm, 6px)",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--ink)",
                    fontSize: "var(--fs-body)",
                    resize: "vertical",
                  }}
                />
              </div>
            )}

            {/* Section 2: Ineligible Horses (Rule Enforced) */}
            {data.ineligible.length > 0 && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <h4 style={{ margin: 0, fontSize: "var(--fs-sm, 0.875rem)", fontWeight: 700, color: "var(--muted)" }}>
                    {tr("Ineligible Horses (Blocked by System)")} ({data.ineligible.length})
                  </h4>
                  <Badge tone="neutral">{tr("Rule Enforced")}</Badge>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "180px", overflowY: "auto" }}>
                  {data.ineligible.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        padding: "0.625rem 0.75rem",
                        borderRadius: "var(--r-sm, 6px)",
                        border: "1px dashed var(--danger-border, #fecaca)",
                        background: "var(--danger-bg, #fff5f5)",
                        gap: "0.75rem",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--ink)" }}>
                          {h.name}
                        </span>
                        <div style={{ fontSize: "var(--fs-xs)", color: "var(--danger, #dc2626)", marginTop: "3px", display: "flex", flexDirection: "column", gap: "2px" }}>
                          {h.ineligibleReasons && h.ineligibleReasons.length > 0 ? (
                            h.ineligibleReasons.map((r, rIdx) => (
                              <div key={rIdx} style={{ display: "flex", alignItems: "flex-start", gap: "4px" }}>
                                <span style={{ flexShrink: 0 }}>⚠️</span>
                                <span>{formatIneligibleReason(r, isVietnamese())}</span>
                              </div>
                            ))
                          ) : (
                            <div>⚠️ {isVietnamese() ? "Không đáp ứng quy định thi đấu" : tr("Did not meet entry criteria")}</div>
                          )}
                        </div>
                      </div>
                      <Badge tone="danger">{tr("Blocked")}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </Modal>
  );
}
