import { useState, useEffect } from "react";
import { Modal } from "@/shared/components/ui/Modal";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { tr } from "@/shared/i18n/tr";
import { recordRaceResults, lockRaceResults, type SingleResultInput } from "../api";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tournament && tournament.registrations) {
      const initial = tournament.registrations.map((reg, index) => {
        const existing = reg.result;
        const rank = existing?.finalRank ?? index + 1;
        const time = existing?.finishTimeSeconds ?? 70 + index * 1.5;
        const speed =
          existing?.avgSpeedKmh ??
          Math.round(((tournament.distanceMeters / time) * 3.6) * 100) / 100;
        const prize =
          existing?.prizeMoneyWon ??
          (rank === 1 ? Math.round(tournament.prizePool * 0.5) : rank === 2 ? Math.round(tournament.prizePool * 0.25) : 0);

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
      queueMicrotask(() => {
        setRows(initial);
      });
    }
  }, [tournament, isOpen]);

  if (!isOpen) return null;

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
      title={tr("Record Race Execution & Official Results")}
      subtitle={`${tournament.name} · ${tournament.distanceMeters}m (${tr(tournament.trackType)})`}
      width={760}
      onClose={onClose}
      foot={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div>
            {isClubManager ? (
              <Badge tone="warn">{tr("Club Manager: Authorized to Lock")}</Badge>
            ) : (
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
                {tr("Trainer Draft Entry · CM must lock results")}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
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

        <div style={{ maxHeight: "360px", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--fs-sm)" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left", color: "var(--muted)" }}>
                <th style={{ padding: "0.5rem" }}>{tr("Horse")}</th>
                <th style={{ padding: "0.5rem", width: "80px" }}>{tr("Rank")}</th>
                <th style={{ padding: "0.5rem", width: "100px" }}>{tr("Time (s)")}</th>
                <th style={{ padding: "0.5rem", width: "90px" }}>{tr("Speed (km/h)")}</th>
                <th style={{ padding: "0.5rem", width: "130px" }}>{tr("Prize Won (VND)")}</th>
                <th style={{ padding: "0.5rem" }}>{tr("Official Notes")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.registrationId} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.625rem 0.5rem", fontWeight: 700, color: "var(--ink)" }}>
                    {row.horseName}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
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
                  </td>
                  <td style={{ padding: "0.5rem" }}>
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
                  </td>
                  <td style={{ padding: "0.5rem", fontWeight: 600, color: "var(--brand, #10b981)" }}>
                    {row.avgSpeedKmh}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
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
                        padding: "0.375rem 0.5rem",
                        borderRadius: "var(--r-sm, 4px)",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        color: "var(--ink)",
                      }}
                    />
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder={tr("e.g. Broke out cleanly, strong stretch run")}
                      value={row.officialNotes}
                      onChange={(e) => handleFieldChange(idx, "officialNotes", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.375rem 0.5rem",
                        borderRadius: "var(--r-sm, 4px)",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        color: "var(--ink)",
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
