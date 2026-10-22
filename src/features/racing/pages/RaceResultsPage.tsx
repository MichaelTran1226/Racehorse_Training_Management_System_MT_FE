import { useState, useEffect } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { tr } from "@/shared/i18n/tr";
import { fetchTournaments, fetchTournamentDetail } from "../api";
import type { Tournament } from "../types";

export default function RaceResultsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadCompletedTournaments() {
    setLoading(true);
    try {
      const res = await fetchTournaments({ status: "COMPLETED" });
      const completedList = res.items;
      setTournaments(completedList);
      if (completedList.length > 0) {
        setSelectedTournamentId(completedList[0].id);
      }
    } catch (err) {
      console.error("Failed to load completed tournaments", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: string) {
    try {
      const detail = await fetchTournamentDetail(id);
      setSelectedTournament(detail);
    } catch (err) {
      console.error("Failed to load tournament detail", err);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadCompletedTournaments();
    });
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      queueMicrotask(() => {
        void loadDetail(selectedTournamentId);
      });
    }
  }, [selectedTournamentId]);

  const finishedRegistrations = (selectedTournament?.registrations ?? [])
    .filter((r) => r.result)
    .sort((a, b) => (a.result?.finalRank ?? 99) - (b.result?.finalRank ?? 99));

  const firstPlace = finishedRegistrations[0];
  const secondPlace = finishedRegistrations[1];
  const thirdPlace = finishedRegistrations[2];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PageHeader
        title={tr("Official Race Results & Championship Hall of Fame")}
        description={tr(
          "Verified tournament standings, sprint speeds, prize money distributions, and club career statistics.",
        )}
      />

      {loading ? (
        <Card pad={32}>
          <div style={{ textAlign: "center", color: "var(--muted)" }}>{tr("Loading race results...")}</div>
        </Card>
      ) : tournaments.length === 0 ? (
        <Card pad={32}>
          <EmptyState
            title={tr("No Completed Tournaments Yet")}
            description={tr("Race results and champion podiums will appear here once official results are locked.")}
          />
        </Card>
      ) : (
        <>
          {/* Tournament Selector */}
          <Card pad={16}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <label style={{ fontWeight: 600, fontSize: "var(--fs-sm)" }}>
                  {tr("Select Championship Event:")}
                </label>
                <select
                  value={selectedTournamentId}
                  onChange={(e) => setSelectedTournamentId(e.target.value)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "var(--r-sm, 6px)",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--ink)",
                    fontSize: "var(--fs-body)",
                    fontWeight: 600,
                  }}
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({new Date(t.raceDate).toLocaleDateString()} · {t.distanceMeters}m)
                    </option>
                  ))}
                </select>
              </div>

              {selectedTournament && (
                <div style={{ display: "flex", gap: "1rem", fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
                  <span>📍 {selectedTournament.location}</span>
                  <span>📏 {selectedTournament.distanceMeters}m ({tr(selectedTournament.trackType)})</span>
                  <span>💰 {tr("Purse:")} {selectedTournament.prizePool.toLocaleString()} đ</span>
                </div>
              )}
            </div>
          </Card>

          {/* Podium for Top 3 */}
          {firstPlace && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {/* Gold 1st */}
              <Card pad={20}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderLeft: "4px solid #f59e0b", paddingLeft: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "#d97706" }}>
                      🥇 {tr("CHAMPION / 1ST PLACE")}
                    </span>
                    <Badge tone="ok">{firstPlace.result?.avgSpeedKmh} km/h</Badge>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "var(--fs-kpi, 1.25rem)", fontWeight: 800, color: "var(--ink)" }}>
                      {firstPlace.horse.name}
                    </h3>
                    <p style={{ margin: "2px 0 0 0", fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
                      {firstPlace.horse.breed} · #{firstPlace.horse.horseCode || "N/A"}
                    </p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)" }}>
                    <span style={{ color: "var(--muted)" }}>{tr("Finish Time:")}</span>
                    <strong>{firstPlace.result?.finishTimeSeconds}s</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)" }}>
                    <span style={{ color: "var(--muted)" }}>{tr("Prize Won:")}</span>
                    <strong style={{ color: "var(--brand, #10b981)" }}>
                      {firstPlace.result?.prizeMoneyWon.toLocaleString()} đ
                    </strong>
                  </div>
                  {firstPlace.result?.officialNotes && (
                    <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--muted)", fontStyle: "italic" }}>
                      "{firstPlace.result.officialNotes}"
                    </p>
                  )}
                </div>
              </Card>

              {/* Silver 2nd */}
              {secondPlace && (
                <Card pad={20}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderLeft: "4px solid #94a3b8", paddingLeft: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "#64748b" }}>
                        🥈 {tr("RUNNER-UP / 2ND PLACE")}
                      </span>
                      <Badge tone="neutral">{secondPlace.result?.avgSpeedKmh} km/h</Badge>
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "var(--fs-kpi, 1.25rem)", fontWeight: 800, color: "var(--ink)" }}>
                        {secondPlace.horse.name}
                      </h3>
                      <p style={{ margin: "2px 0 0 0", fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
                        {secondPlace.horse.breed} · #{secondPlace.horse.horseCode || "N/A"}
                      </p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)" }}>
                      <span style={{ color: "var(--muted)" }}>{tr("Finish Time:")}</span>
                      <strong>{secondPlace.result?.finishTimeSeconds}s</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)" }}>
                      <span style={{ color: "var(--muted)" }}>{tr("Prize Won:")}</span>
                      <strong style={{ color: "var(--brand, #10b981)" }}>
                        {secondPlace.result?.prizeMoneyWon.toLocaleString()} đ
                      </strong>
                    </div>
                  </div>
                </Card>
              )}

              {/* Bronze 3rd */}
              {thirdPlace && (
                <Card pad={20}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderLeft: "4px solid #b45309", paddingLeft: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "var(--fs-xs)", fontWeight: 700, color: "#b45309" }}>
                        🥉 {tr("3RD PLACE")}
                      </span>
                      <Badge tone="neutral">{thirdPlace.result?.avgSpeedKmh} km/h</Badge>
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "var(--fs-kpi, 1.25rem)", fontWeight: 800, color: "var(--ink)" }}>
                        {thirdPlace.horse.name}
                      </h3>
                      <p style={{ margin: "2px 0 0 0", fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
                        {thirdPlace.horse.breed} · #{thirdPlace.horse.horseCode || "N/A"}
                      </p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)" }}>
                      <span style={{ color: "var(--muted)" }}>{tr("Finish Time:")}</span>
                      <strong>{thirdPlace.result?.finishTimeSeconds}s</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-sm)" }}>
                      <span style={{ color: "var(--muted)" }}>{tr("Prize Won:")}</span>
                      <strong style={{ color: "var(--brand, #10b981)" }}>
                        {thirdPlace.result?.prizeMoneyWon.toLocaleString()} đ
                      </strong>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Complete Final Standings Table */}
          <Card pad={20}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "var(--fs-base, 1.125rem)", fontWeight: 700, color: "var(--ink)" }}>
              {tr("Complete Official Standings")}
            </h3>

            {finishedRegistrations.length === 0 ? (
              <p style={{ color: "var(--muted)", margin: 0 }}>{tr("No finishes recorded for this tournament.")}</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--fs-sm)" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left", color: "var(--muted)" }}>
                      <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Rank")}</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Horse")}</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Owner")}</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Finish Time")}</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Avg Speed")}</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Prize Won")}</th>
                      <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Official Verdict / Notes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finishedRegistrations.map((reg) => (
                      <tr key={reg.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700 }}>
                          #{reg.result?.finalRank}
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <strong style={{ color: "var(--ink)" }}>{reg.horse.name}</strong>
                          <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", display: "block" }}>
                            {reg.horse.breed}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", color: "var(--muted)" }}>
                          {reg.horse.owner?.fullName || tr("Club Owned")}
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>
                          {reg.result?.finishTimeSeconds}s
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", color: "var(--brand, #10b981)", fontWeight: 700 }}>
                          {reg.result?.avgSpeedKmh} km/h
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>
                          {reg.result?.prizeMoneyWon ? `${reg.result.prizeMoneyWon.toLocaleString()} đ` : "—"}
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", color: "var(--muted)", fontStyle: "italic" }}>
                          {reg.result?.officialNotes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
