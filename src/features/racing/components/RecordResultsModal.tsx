import { useState, useEffect } from "react";
import { Modal } from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { tr } from "@/shared/i18n/tr";
import { recordRaceResults, lockRaceResults, fetchTournamentDetail, type SingleResultInput } from "../api";
import type { Tournament } from "../types";

interface RecordResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  isClubManager: boolean;
  onSuccess: () => void;
}

export function RecordResultsModal({
  isOpen,
  onClose,
  tournament,
  isClubManager,
  onSuccess,
}: RecordResultsModalProps) {
  const [rows, setRows] = useState<
    Array<{
      registrationId: string;
      horseName: string;
      finalRank: number;
      finishTimeSeconds: number;
      avgSpeedKmh: number;
      prizeMoneyWon: number;
      officialNotes: string;
    }>
  >([]);
  const [detailTournament, setDetailTournament] = useState<Tournament | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !tournament?.id) return;
    setLoadingDetail(true);
    setError(null);
    fetchTournamentDetail(tournament.id)
      .then((full) => {
        setDetailTournament(full);
        if (full.registrations && full.registrations.length > 0) {
          const initial = full.registrations.map((reg, index) => {
            const existing = reg.result;
            const rank = existing?.finalRank ?? index + 1;
            const time = existing?.finishTimeSeconds ?? 70 + index * 1.5;
            const speed =
              existing?.avgSpeedKmh ??
              Math.round(((full.distanceMeters / time) * 3.6) * 100) / 100;
            const prize =
              existing?.prizeMoneyWon ??
              (rank === 1
                ? Math.round(full.prizePool * 0.5)
                : rank === 2
                ? Math.round(full.prizePool * 0.25)
                : rank === 3
                ? Math.round(full.prizePool * 0.15)
                : rank === 4
                ? Math.round(full.prizePool * 0.1)
                : 0);

            return {
              registrationId: reg.id,
              horseName: reg.horse.name,
              finalRank: rank,
              finishTimeSeconds: time,
              avgSpeedKmh: speed,
              prizeMoneyWon: prize,
              officialNotes: existing?.officialNotes ?? "",
            };
          });
          setRows(initial);
        } else {
          setRows([]);
        }
      })
      .catch((err) => setError(err?.message || tr("Failed to load tournament registrations")))
      .finally(() => setLoadingDetail(false));
  }, [tournament?.id, isOpen]);

  if (!isOpen) return null;

  const currentTourney = detailTournament ?? tournament;
  const isCompleted = currentTourney.status === "COMPLETED";


  function handleFieldChange(index: number, field: string, val: any) {
    setRows((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: val };
      if (field === "finishTimeSeconds" && val > 0) {
        target.avgSpeedKmh =
          Math.round(((tournament.distanceMeters / Number(val)) * 3.6) * 100) / 100;
      }
      next[index] = target;
      return next;
    });
  }

  async function handleSave(lock: boolean = false) {
    if (rows.length === 0) {
      setError(tr("No registered horses to record results for"));
      return;
    }

    if (lock && !isClubManager) {
      setError(tr("Only the Club Manager has the authority to officially lock results."));
      return;
    }

    if (lock) {
      const confirmLock = window.confirm(
        tr(
          "Are you sure you want to officially lock the race results? This will complete the tournament, transition horses to RESTING, and auto-credit 70% prize winnings to owners.",
        ),
      );
      if (!confirmLock) return;
    }

    setLoading(true);
    setError(null);
    try {
      const resultsPayload: SingleResultInput[] = rows.map((r) => ({
        registrationId: r.registrationId,
        finalRank: Number(r.finalRank),
        finishTimeSeconds: Number(r.finishTimeSeconds),
        avgSpeedKmh: Number(r.avgSpeedKmh),
        prizeMoneyWon: Number(r.prizeMoneyWon),
        officialNotes: r.officialNotes.trim() || undefined,
      }));

      await recordRaceResults(tournament.id, resultsPayload, lock);
      if (lock) {
        await lockRaceResults(tournament.id);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || tr("Failed to record race results"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title={isCompleted ? tr("Official Race Results (Locked)") : tr("Record Race Execution & Official Results")}
      subtitle={`${currentTourney.name} · ${currentTourney.distanceMeters}m (${tr(currentTourney.trackType)})`}
      width={860}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div>
            {isCompleted ? (
              <Badge tone="ok">🏆 {tr("Official Results Locked")}</Badge>
            ) : isClubManager ? (
              <Badge tone="warn">{tr("Club Manager: Authorized to Lock")}</Badge>
            ) : (
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
                {tr("Trainer Draft Entry · CM must lock results")}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {isCompleted ? (
              <Button tone="primary" onClick={onClose}>
                {tr("Close")}
              </Button>
            ) : (
              <>
                <Button tone="secondary" onClick={onClose} disabled={loading}>
                  {tr("Cancel")}
                </Button>
                <Button tone="quiet" onClick={() => handleSave(false)} disabled={loading}>
                  {loading ? tr("Saving...") : tr("Save Draft")}
                </Button>
                {isClubManager && (
                  <Button tone="primary" onClick={() => handleSave(true)} disabled={loading}>
                    🔒 {loading ? tr("Locking...") : tr("Lock Official Results")}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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

        {loadingDetail ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>
            {tr("Loading race entries and results...")}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--muted)", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--border)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏁</div>
            <strong style={{ display: "block", color: "var(--ink)", fontSize: "var(--fs-body)", marginBottom: "0.25rem" }}>
              {tr("Chưa có kết quả hoặc danh sách đăng ký cho giải đấu này")}
            </strong>
            <p style={{ margin: 0, fontSize: "var(--fs-sm)" }}>
              {isCompleted
                ? tr("Giải đấu ở trạng thái Đã hoàn thành nhưng chưa có chiến mã nào được ghi nhận kết quả.")
                : tr("Giải đấu chưa có ngựa đăng ký tham gia. Hãy đăng ký ngựa thi đấu trước khi ghi nhận kết quả.")}
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: "380px", overflowY: "auto", overflowX: "hidden", width: "100%" }}>
            <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: "var(--fs-sm)" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left", color: "var(--muted)" }}>
                  <th style={{ padding: "0.5rem", width: "20%" }}>{tr("Horse")}</th>
                  <th style={{ padding: "0.5rem", width: "11%" }}>{tr("Rank")}</th>
                  <th style={{ padding: "0.5rem", width: "13%" }}>{tr("Time (s)")}</th>
                  <th style={{ padding: "0.5rem", width: "13%" }}>{tr("Speed (km/h)")}</th>
                  <th style={{ padding: "0.5rem", width: "18%" }}>{tr("Prize Won (VND)")}</th>
                  <th style={{ padding: "0.5rem", width: "25%" }}>{tr("Official Notes")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.registrationId} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.625rem 0.5rem", fontWeight: 700, color: "var(--ink)", wordBreak: "break-word" }}>
                      {row.horseName}
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      {isCompleted ? (
                        <strong style={{ color: row.finalRank === 1 ? "var(--brand)" : "inherit" }}>
                          #{row.finalRank}
                        </strong>
                      ) : (
                        <input
                          type="number"
                          min={1}
                          value={row.finalRank}
                          onChange={(e) => handleFieldChange(idx, "finalRank", Number(e.target.value))}
                          style={{
                            width: "100%",
                            padding: "0.375rem 0.5rem",
                            borderRadius: "var(--r-sm, 4px)",
                            border: "1px solid var(--border)",
                            background: "var(--surface)",
                            color: "var(--ink)",
                          }}
                        />
                      )}
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      {isCompleted ? (
                        <span>{row.finishTimeSeconds}s</span>
                      ) : (
                        <input
                          type="number"
                          step={0.01}
                          min={1}
                          value={row.finishTimeSeconds}
                          onChange={(e) =>
                            handleFieldChange(idx, "finishTimeSeconds", Number(e.target.value))
                          }
                          style={{
                            width: "100%",
                            padding: "0.375rem 0.5rem",
                            borderRadius: "var(--r-sm, 4px)",
                            border: "1px solid var(--border)",
                            background: "var(--surface)",
                            color: "var(--ink)",
                          }}
                        />
                      )}
                    </td>
                    <td style={{ padding: "0.5rem", fontWeight: 600, color: "var(--brand, #10b981)" }}>
                      {row.avgSpeedKmh}
                    </td>
                    <td style={{ padding: "0.5rem", wordBreak: "break-word" }}>
                      {isCompleted ? (
                        <span style={{ fontWeight: 600, color: row.prizeMoneyWon > 0 ? "var(--brand)" : "var(--muted)", whiteSpace: "nowrap" }}>
                          {row.prizeMoneyWon.toLocaleString()} đ
                        </span>
                      ) : (
                        <input
                          type="number"
                          step={1000000}
                          min={0}
                          value={row.prizeMoneyWon}
                          onChange={(e) =>
                            handleFieldChange(idx, "prizeMoneyWon", Number(e.target.value))
                          }
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "0.375rem 0.5rem",
                            borderRadius: "var(--r-sm, 4px)",
                            border: "1px solid var(--border)",
                            background: "var(--surface)",
                            color: "var(--ink)",
                          }}
                        />
                      )}
                    </td>
                    <td style={{ padding: "0.5rem", wordBreak: "break-word" }}>
                      {isCompleted ? (
                        <span style={{ color: "var(--muted)", wordBreak: "break-word", whiteSpace: "normal", lineHeight: 1.4, fontSize: "var(--fs-xs)" }}>
                          {row.officialNotes || "—"}
                        </span>
                      ) : (
                        <input
                          type="text"
                          placeholder={tr("e.g. Broke out cleanly, strong stretch run")}
                          value={row.officialNotes}
                          onChange={(e) => handleFieldChange(idx, "officialNotes", e.target.value)}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "0.375rem 0.5rem",
                            borderRadius: "var(--r-sm, 4px)",
                            border: "1px solid var(--border)",
                            background: "var(--surface)",
                            color: "var(--ink)",
                            fontSize: "var(--fs-xs)",
                          }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}

