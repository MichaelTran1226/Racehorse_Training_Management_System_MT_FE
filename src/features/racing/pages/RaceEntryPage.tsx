import { useState, useEffect } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { KpiTile } from "@/shared/components/ui/KpiTile";
import { Tabs } from "@/shared/components/ui/Tabs";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { tr } from "@/shared/i18n/tr";
import {
  fetchTournaments,
  createTournament,
  updateTournament,
  changeTournamentStatus,
  deleteTournament,
} from "../api";
import type { Tournament, TournamentStatus } from "../types";
import { TournamentModal } from "../components/TournamentModal";
import { RaceRegistrationModal } from "../components/RaceRegistrationModal";
import { RecordResultsModal } from "../components/RecordResultsModal";

export default function RaceEntryPage() {
  const user = useCurrentUser();
  const isClubManager = user.role === "CLUB_MANAGER";
  const isTrainer = user.role === "HEAD_TRAINER";
  const canManage = isClubManager || isTrainer;

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [registeringTournament, setRegisteringTournament] = useState<Tournament | null>(null);
  const [resultsTournament, setResultsTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetchTournaments({
        status: statusFilter,
        search: searchTerm,
      });
      setTournaments(res.items);
    } catch (err) {
      console.error("Failed to load tournaments", err);
    } finally {
      setLoading(false);
    }
  }

  // KPIs
  const totalTournaments = tournaments.length;
  const openCount = tournaments.filter((t) => t.status === "OPEN_REGISTRATION").length;
  const totalPrize = tournaments.reduce((acc, t) => acc + (t.prizePool || 0), 0);
  const totalRegisteredHorses = tournaments.reduce(
    (acc, t) => acc + (t.registeredCount ?? t.registrations?.length ?? 0),
    0,
  );

  async function handleCreateOrEdit(data: Partial<Tournament>) {
    if (editingTournament) {
      await updateTournament(editingTournament.id, data);
    } else {
      await createTournament(data);
    }
    loadData();
  }

  async function handleStatusChange(id: string, newStatus: TournamentStatus) {
    if (window.confirm(tr(`Change tournament status to ${newStatus}?`))) {
      await changeTournamentStatus(id, newStatus);
      loadData();
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm(tr("Are you sure you want to delete this tournament?"))) {
      await deleteTournament(id);
      loadData();
    }
  }

  const filtered = tournaments.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return t.name.toLowerCase().includes(term) || t.location.toLowerCase().includes(term);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PageHeader
        title={tr("Tournament Registration & Race Entries (Flow 5)")}
        description={tr(
          "Official championship management, horse eligibility screening, race execution, and prize money settlement.",
        )}
        action={
          isClubManager ? (
            <Button tone="primary" onClick={() => setIsCreateOpen(true)}>
              + {tr("Create Tournament")}
            </Button>
          ) : undefined
        }
      />

      {/* KPI Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <KpiTile
          label={tr("Championship Tournaments")}
          value={String(totalTournaments)}
          caption={tr("All organized racing events")}
        />
        <KpiTile
          label={tr("Registration Open")}
          value={String(openCount)}
          caption={tr("Actively recruiting club horses")}
          accent={openCount > 0}
        />
        <KpiTile
          label={tr("Total Prize Pool")}
          value={`${(totalPrize / 1000000).toLocaleString()}M`}
          unit="VND"
          caption={tr("Total purse across all seasons")}
        />
        <KpiTile
          label={tr("Enrolled Horses")}
          value={String(totalRegisteredHorses)}
          caption={tr("Active race entries from stable")}
        />
      </div>

      {/* Filter and Tab Bar */}
      <Card pad={16}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <Tabs
            items={[
              { id: "ALL", label: tr("All Events") },
              { id: "OPEN_REGISTRATION", label: tr("Open for Registration") },
              { id: "UPCOMING", label: tr("Upcoming") },
              { id: "COMPLETED", label: tr("Completed") },
              { id: "CANCELLED", label: tr("Cancelled") },
            ]}
            active={statusFilter}
            onChange={(v) => setStatusFilter(v)}
          />

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="text"
              placeholder={tr("Search by name or location...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadData();
              }}
              style={{
                padding: "0.5rem 0.875rem",
                borderRadius: "var(--r-sm, 6px)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink)",
                fontSize: "var(--fs-sm)",
                width: "240px",
              }}
            />
            <Button tone="secondary" onClick={() => loadData()}>
              {tr("Filter")}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tournaments List */}
      {loading ? (
        <Card pad={32}>
          <div style={{ textAlign: "center", color: "var(--muted)" }}>{tr("Loading tournaments...")}</div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card pad={32}>
          <EmptyState
            title={tr("No Tournaments Found")}
            description={tr("No championship events match your current filter parameters.")}
            action={
              isClubManager ? (
                <Button tone="primary" onClick={() => setIsCreateOpen(true)}>
                  + {tr("Create New Tournament")}
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem" }}>
          {filtered.map((tourney) => {
            const registeredCount = tourney.registeredCount ?? tourney.registrations?.length ?? 0;
            const isCompleted = tourney.status === "COMPLETED";
            const isOpenReg = tourney.status === "OPEN_REGISTRATION";
            const isUpcoming = tourney.status === "UPCOMING";

            return (
              <Card key={tourney.id} pad={20}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%", justifyContent: "space-between" }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "var(--fs-kpi, 1.125rem)", fontWeight: 700, color: "var(--ink)" }}>
                          {tourney.name}
                        </h3>
                        <p style={{ margin: "4px 0 0 0", fontSize: "var(--fs-xs, 0.75rem)", color: "var(--muted)" }}>
                          📍 {tourney.location}
                        </p>
                      </div>
                      <Badge
                        tone={
                          isOpenReg
                            ? "ok"
                            : isCompleted
                            ? "neutral"
                            : isUpcoming
                            ? "info"
                            : "danger"
                        }
                      >
                        {tourney.status}
                      </Badge>
                    </div>

                    {/* Specs Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.75rem",
                        marginTop: "1rem",
                        padding: "0.75rem",
                        background: "var(--surface-muted, rgba(0,0,0,0.02))",
                        borderRadius: "var(--r-sm, 6px)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", display: "block" }}>
                          {tr("Race Date")}
                        </span>
                        <strong style={{ fontSize: "var(--fs-sm)", color: "var(--ink)" }}>
                          {new Date(tourney.raceDate).toLocaleDateString()}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", display: "block" }}>
                          {tr("Distance & Surface")}
                        </span>
                        <strong style={{ fontSize: "var(--fs-sm)", color: "var(--ink)" }}>
                          {tourney.distanceMeters}m · {tourney.trackType}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", display: "block" }}>
                          {tr("Registration Deadline")}
                        </span>
                        <span style={{ fontSize: "var(--fs-xs)", color: "var(--ink)", fontWeight: 600 }}>
                          {new Date(tourney.registrationDeadline).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", display: "block" }}>
                          {tr("Purse Pool")}
                        </span>
                        <strong style={{ fontSize: "var(--fs-sm)", color: "var(--brand, #10b981)" }}>
                          {tourney.prizePool.toLocaleString()} đ
                        </strong>
                      </div>
                    </div>

                    {/* Enrolled horses notice */}
                    <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "space-between", fontSize: "var(--fs-xs)" }}>
                      <span style={{ color: "var(--muted)" }}>{tr("Entries from Club:")}</span>
                      <strong style={{ color: "var(--ink)" }}>
                        {registeredCount} {tr("horses registered")}
                      </strong>
                    </div>

                    {/* Results Podium if completed */}
                    {isCompleted && tourney.registrations && tourney.registrations.some((r) => r.result) && (
                      <div
                        style={{
                          marginTop: "0.75rem",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "var(--r-sm)",
                          background: "var(--brand-muted, rgba(16, 185, 129, 0.08))",
                          fontSize: "var(--fs-xs)",
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "var(--brand)" }}>🏆 {tr("Official Results:")}</div>
                        {tourney.registrations
                          .filter((r) => r.result)
                          .sort((a, b) => (a.result?.finalRank ?? 99) - (b.result?.finalRank ?? 99))
                          .slice(0, 3)
                          .map((r) => (
                            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                              <span>
                                #{r.result?.finalRank} {r.horse.name}
                              </span>
                              <span style={{ fontWeight: 600 }}>{r.result?.avgSpeedKmh} km/h</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      paddingTop: "0.75rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {canManage && (isOpenReg || isUpcoming) && (
                        <Button
                          tone="primary"
                          onClick={() => setRegisteringTournament(tourney)}
                        >
                          🏇 {tr("Register Horse")}
                        </Button>
                      )}

                      {canManage && registeredCount > 0 && (
                        <Button
                          tone="quiet"
                          onClick={() => setResultsTournament(tourney)}
                        >
                          ⏱️ {isCompleted ? tr("View Results") : tr("Record Results")}
                        </Button>
                      )}
                    </div>

                    {isClubManager && (
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        <Button
                          tone="secondary"
                          onClick={() => setEditingTournament(tourney)}
                        >
                          {tr("Edit")}
                        </Button>
                        {registeredCount === 0 && !isCompleted && (
                          <Button
                            tone="danger"
                            onClick={() => handleDelete(tourney.id)}
                          >
                            {tr("Delete")}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal 1: Create Tournament */}
      <TournamentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateOrEdit}
      />

      {/* Modal 2: Edit Tournament */}
      {editingTournament && (
        <TournamentModal
          isOpen={true}
          initialData={editingTournament}
          onClose={() => setEditingTournament(null)}
          onSubmit={handleCreateOrEdit}
        />
      )}

      {/* Modal 3: Race Registration (Eligibility screening) */}
      {registeringTournament && (
        <RaceRegistrationModal
          isOpen={true}
          tournament={registeringTournament}
          onClose={() => setRegisteringTournament(null)}
          onSuccess={loadData}
        />
      )}

      {/* Modal 4: Record Results & Lock */}
      {resultsTournament && (
        <RecordResultsModal
          isOpen={true}
          tournament={resultsTournament}
          isClubManager={isClubManager}
          onClose={() => setResultsTournament(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
