import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { HealthBadge } from "@/shared/components/ui/HealthBadge";
import { formatDate } from "@/shared/lib/format";
import type { HealthStatus } from "@/shared/types/enums";
import type { AuthUser } from "@/shared/types/auth";
import { getHealthBoard, type HealthBoardResponse } from "@/features/health/api";
import { todayClub, trainingApi } from "@/features/training/api";
import { EXERCISE_TYPE_LABEL, SESSION_STATUS_LABEL, type ExerciseSession } from "@/features/training/types";
import { getZones } from "@/features/stable/api";
import { getHorses } from "@/features/horses/api";
import { listAccounts } from "@/features/accounts/api";
import { Block, Line, Stat, StatRow, TwoCols } from "./DashboardBlocks";
import { useLoaded } from "./useLoaded";

import { tr } from "@/shared/i18n/tr";
const COLOR = { ok: "var(--ok)", warn: "var(--warn)", danger: "var(--danger)", violet: "var(--violet)" };

const byTime = (a: ExerciseSession, b: ExerciseSession) => a.scheduledAt.localeCompare(b.scheduledAt);

/** Lịch tập hôm nay (dùng chung CM, HT, GROOM; BE tự giới hạn theo vai trò). */
function TodaySessions({ title, recordLinks }: { title: string; recordLinks?: boolean }) {
  const state = useLoaded(() => trainingApi.getSessions({ date: todayClub() }));
  return (
    <Block
      title={title}
      subtitle={formatDate(new Date())}
      state={state}
      empty={(list) => (list.filter((s) => s.status !== "CANCELLED").length === 0 ? "No workouts scheduled today." : null)}
    >
      {(list) => (
        <div>
          {list
            .filter((s) => s.status !== "CANCELLED")
            .sort(byTime)
            .map((s) => (
              <Line
                key={s.id}
                main={`${s.startTime} · ${s.horseName}`}
                sub={`${EXERCISE_TYPE_LABEL[s.sessionType]} · ${s.targetDistanceMeters} m${s.stallCode ? ` · Stall ${s.stallCode}` : ""}${s.groomName ? ` · ${s.groomName}` : ""}`}
                right={
                  recordLinks && s.status === "SCHEDULED" && new Date(s.scheduledAt) <= new Date() ? (
                    <Link to={`/training/sessions/${s.id}/result`}>
                      <Button size="sm">Record result</Button>
                    </Link>
                  ) : (
                    <Badge tone={s.status === "COMPLETED" ? "ok" : s.status === "BLOCKED" ? "danger" : "neutral"}>
                      {SESSION_STATUS_LABEL[s.status]}
                    </Badge>
                  )
                }
              />
            ))}
        </div>
      )}
    </Block>
  );
}

/** Ngựa đang khóa / cần theo dõi (CM, VET). */
function MedicalWatch({ state }: { state: ReturnType<typeof useLoaded<HealthBoardResponse>> }) {
  return (
    <Block
      title={tr("Medical safety")}
      subtitle={tr("Training Locks and horses under observation")}
      state={state}
      action={<Link to="/herd">Herd health →</Link>}
      empty={(b) => (b.data.some((h) => h.isMedicalLocked || h.healthGroup !== "QUALIFIED") ? null : "Every horse is fit to work.")}
    >
      {(b) => (
        <div>
          {b.data
            .filter((h) => h.isMedicalLocked || h.healthGroup !== "QUALIFIED")
            .map((h) => (
              <Line
                key={h.id}
                main={
                  <>
                    {h.name} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>{h.stallCode ? `(${h.stallCode})` : ""}</span>
                  </>
                }
                sub={
                  h.lock
                    ? `Locked since ${formatDate(h.lock.lockedAt)}${h.lock.recheckDate ? ` · review ${formatDate(h.lock.recheckDate)}` : ""}`
                    : h.latestRecord?.diagnosis ?? undefined
                }
                right={
                  <span style={{ display: "flex", gap: 6 }}>
                    <HealthBadge status={h.status as HealthStatus} />
                    {h.isMedicalLocked && <Badge tone="danger" icon="lock">Training Lock</Badge>}
                  </span>
                }
              />
            ))}
        </div>
      )}
    </Block>
  );
}

// ------------------------------------------------------------------ Club Manager (M01 Tổng quan câu lạc bộ)

export function ManagerDashboard({ user }: { user: AuthUser }) {
  const board = useLoaded(getHealthBoard, !!user.permissions.viewMedical);
  const overview = useLoaded(() => trainingApi.getOverview());
  const zones = useLoaded(() => getZones());
  const pending = useLoaded(
    () => listAccounts().then((r) => r.accounts.filter((a) => a.status === "PENDING_APPROVAL")),
    !!user.permissions.manageAccounts,
  );
  const s = board.data?.summary;
  const k = overview.data?.kpis;
  const zoneTotal = (zones.data ?? []).reduce((n, z) => n + (z.stallCount ?? 0), 0);
  const zoneUsed = (zones.data ?? []).reduce((n, z) => n + (z.occupiedCount ?? 0), 0);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <StatRow>
        <Stat
          label={tr("Horses under management")}
          value={s?.total ?? "—"}
          caption={s ? tr(`${s.qualifiedCount} fit · ${s.total - s.qualifiedCount} in a medical status`) : undefined}
        />
        <Stat
          label={tr("Workouts today")}
          value={k ? `${k.todayCompleted}/${k.todayTotal}` : "—"}
          caption={k ? tr(`${k.activePlans} active plans · ${k.blockedNext7Days} blocked in 7 days`) : undefined}
        />
        <Stat
          label={tr("Medical attention")}
          value={s ? s.lockedCount + s.observationCount : "—"}
          caption={s ? tr(`${s.lockedCount} Training Lock · ${s.observationCount} under observation`) : undefined}
          tone={COLOR.danger}
        />
        <Stat label={tr("Stall occupancy")} value={zones.data ? `${zoneUsed}/${zoneTotal}` : "—"} caption={tr("occupied / active stalls")} />
      </StatRow>

      <TwoCols>
        <Block
          title={tr("Action items")}
          state={overview}
          empty={() => null}
        >
          {(ov) => {
            const items = [
              pending.data && pending.data.length > 0 && {
                tag: "Accounts",
                text: `${pending.data.length} Horse Owner request(s) waiting for approval.`,
                to: "/accounts",
                cta: "Review",
              },
              ov.kpis.blockedNext7Days > 0 && {
                tag: "Training",
                text: `${ov.kpis.blockedNext7Days} workout(s) blocked by a Training Lock in the next 7 days.`,
                to: "/training",
                cta: "Open overview",
              },
              ov.kpis.loadSpikeHorses > 0 && {
                tag: "Training",
                text: `${ov.kpis.loadSpikeHorses} horse(s) with a sudden training load increase.`,
                to: "/training",
                cta: "Check",
              },
              zones.data && zoneTotal - zoneUsed > 0 && {
                tag: "Stable",
                text: `${zoneTotal - zoneUsed} empty stall(s) ready for a horse.`,
                to: "/stables/map",
                cta: "Stable map",
              },
            ].filter(Boolean) as Array<{ tag: string; text: string; to: string; cta: string }>;
            if (items.length === 0) return <p style={{ margin: 0, color: "var(--text-muted)" }}>{tr("Nothing urgent today.")}</p>;
            return (
              <div>
                {items.map((i) => (
                  <Line
                    key={i.text}
                    main={<><Badge tone="info">{i.tag}</Badge> {i.text}</>}
                    right={
                      <Link to={i.to}>
                        <Button size="sm" tone="secondary">{i.cta}</Button>
                      </Link>
                    }
                  />
                ))}
              </div>
            );
          }}
        </Block>
        {user.permissions.viewMedical && <MedicalWatch state={board} />}
      </TwoCols>

      <TwoCols>
        <TodaySessions title={tr("Today's training schedule")} />
        <Block title={tr("Stall capacity")} state={zones} action={<Link to="/stables/map">Stable map →</Link>} empty={(z) => (z.length ? null : "No barn zones yet.")}>
          {(list) => (
            <div style={{ display: "grid", gap: 10 }}>
              {list.map((z) => {
                const pct = z.stallCount ? Math.round(((z.occupiedCount ?? 0) / z.stallCount) * 100) : 0;
                return (
                  <div key={z.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-body)" }}>
                      <span>{z.name}</span>
                      <span>
                        {z.occupiedCount ?? 0}/{z.stallCount ?? 0} ({pct}%)
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: "var(--surface-2)" }}>
                      <div style={{ width: `${pct}%`, height: 8, borderRadius: 999, background: pct >= 90 ? COLOR.danger : COLOR.ok }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Block>
      </TwoCols>
    </div>
  );
}

// ------------------------------------------------------------------ Head Trainer

export function TrainerDashboard() {
  const overview = useLoaded(() => trainingApi.getOverview());
  const alerts = useLoaded(() => trainingApi.getAlerts());
  const k = overview.data?.kpis;
  const openAlerts = (alerts.data ?? []).filter((a) => !a.acknowledgedByVet).length;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <StatRow>
        <Stat label={tr("Active training plans")} value={k?.activePlans ?? "—"} />
        <Stat label={tr("Workouts today")} value={k ? `${k.todayCompleted}/${k.todayTotal}` : "—"} caption={tr("completed / scheduled")} />
        <Stat label={tr("Blocked in the next 7 days")} value={k?.blockedNext7Days ?? "—"} caption={tr("heavy workouts under a Training Lock")} tone={COLOR.danger} />
        <Stat label={tr("Sudden load increase")} value={k?.loadSpikeHorses ?? "—"} caption={tr("7-day load > 130% of the 4-week average")} tone={COLOR.warn} />
      </StatRow>
      <TwoCols>
        <TodaySessions title={tr("Today's workouts")} recordLinks />
        <Block
          title={tr("Horses to watch")}
          subtitle={tr("Training Lock or sudden load increase")}
          state={overview}
          action={<Link to="/training">Training overview →</Link>}
          empty={(ov) => (ov.rows.some((r) => r.loadSpike || r.horse.isMedicalLocked) ? null : "No horse needs attention.")}
        >
          {(ov) => (
            <div>
              {ov.rows
                .filter((r) => r.loadSpike || r.horse.isMedicalLocked)
                .map((r) => (
                  <Line
                    key={r.horse.id}
                    main={r.horse.name}
                    sub={`${r.plan ? r.plan.name : "No active plan"} · 7-day load ${r.load7d}`}
                    right={
                      <span style={{ display: "flex", gap: 6 }}>
                        {r.horse.isMedicalLocked && <Badge tone="danger" icon="lock">Training Lock</Badge>}
                        {r.loadSpike && <Badge tone="warn">Load spike</Badge>}
                      </span>
                    }
                  />
                ))}
            </div>
          )}
        </Block>
      </TwoCols>
      <Block
        title={tr("Abnormal-sign alerts")}
        subtitle={tr("Reviewed by the Veterinarian")}
        state={alerts}
        action={<Link to="/alerts">All alerts →</Link>}
        empty={(list) => (list.length === 0 ? "No alerts." : null)}
      >
        {(list) => (
          <div>
            <p style={{ margin: "0 0 6px", fontSize: "var(--fs-body)" }}>{openAlerts} {tr("waiting for the Veterinarian.")}</p>
            {list.slice(0, 5).map((a) => (
              <Line
                key={a.id}
                main={`${a.horseName} · ${formatDate(a.sessionDate)}`}
                sub={a.message}
                right={<Badge tone={a.acknowledgedByVet ? "ok" : "danger"}>{a.acknowledgedByVet ? "Reviewed" : "Pending"}</Badge>}
              />
            ))}
          </div>
        )}
      </Block>
    </div>
  );
}

// ------------------------------------------------------------------ Veterinarian

export function VetDashboard() {
  const board = useLoaded(getHealthBoard);
  const alerts = useLoaded(() => trainingApi.getAlerts());
  const s = board.data?.summary;
  // Mốc "trong 3 ngày tới" tính một lần khi mở trang.
  const [soon] = useState(() => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
  const reviews = (board.data?.data ?? [])
    .filter((h) => h.lock?.recheckDate && new Date(h.lock.recheckDate) <= soon)
    .sort((a, b) => (a.lock!.recheckDate! < b.lock!.recheckDate! ? -1 : 1));
  const openAlerts = (alerts.data ?? []).filter((a) => !a.acknowledgedByVet);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <StatRow>
        <Stat label={tr("Training Locks in force")} value={s?.lockedCount ?? "—"} tone={COLOR.danger} />
        <Stat label={tr("Under observation")} value={s?.observationCount ?? "—"} tone={COLOR.warn} />
        <Stat label={tr("Injured / isolated")} value={s ? s.injuredCount + s.isolatedCount : "—"} tone={COLOR.violet} />
        <Stat label={tr("Alerts to review")} value={alerts.data ? openAlerts.length : "—"} tone={COLOR.danger} />
        <Stat label={tr("Preventive care overdue")} value={s?.overdueCount ?? "—"} tone={COLOR.warn} />
      </StatRow>
      <TwoCols>
        <Block
          title={tr("Abnormal signs to review")}
          state={alerts}
          action={<Link to="/alerts">{tr("All alerts →")}</Link>}
          empty={() => (openAlerts.length === 0 ? tr("No alert is waiting for you.") : null)}
        >
          {() => (
            <div>
              {openAlerts.map((a) => (
                <Line
                  key={a.id}
                  main={`${a.horseName} · ${formatDate(a.sessionDate)}`}
                  sub={a.message}
                  right={
                    <Link to="/alerts">
                      <Button size="sm">{tr("Review")}</Button>
                    </Link>
                  }
                />
              ))}
            </div>
          )}
        </Block>
        <Block
          title={tr("Lock reviews due")}
          subtitle={tr("Review date within 3 days or passed")}
          state={board}
          action={<Link to="/medical/locks">{tr("Training Locks →")}</Link>}
          empty={() => (reviews.length === 0 ? tr("No lock review is due.") : null)}
        >
          {() => (
            <div>
              {reviews.map((h) => (
                <Line
                  key={h.id}
                  main={h.name}
                  sub={`${tr("Review {{date}}", { date: formatDate(h.lock!.recheckDate!) })}${new Date(h.lock!.recheckDate!) < new Date() ? ` ${tr("(overdue)")}` : ""}`}
                  right={
                    <Link to={`/medical/horses/${h.id}`}>
                      <Button size="sm" tone="secondary">{tr("Open")}</Button>
                    </Link>
                  }
                />
              ))}
            </div>
          )}
        </Block>
      </TwoCols>
      <Block
        title={tr("Preventive care overdue")}
        state={board}
        action={<Link to="/vaccine">{tr("Preventive care →")}</Link>}
        empty={(b) => (b.data.some((h) => h.hasOverduePreventive) ? null : tr("Nothing overdue."))}
      >
        {(b) => (
          <div>
            {b.data
              .filter((h) => h.hasOverduePreventive)
              .map((h) => (
                <Line
                  key={h.id}
                  main={h.name}
                  sub={h.preventiveDue
                    .filter((p) => p.overdue)
                    .map((p) => `${p.name} (${formatDate(p.dueDate)})`)
                    .join(", ")}
                />
              ))}
          </div>
        )}
      </Block>
    </div>
  );
}

// ------------------------------------------------------------------ Groom

export function GroomDashboard() {
  const horses = useLoaded(() => getHorses({ limit: 100 }));
  return (
    <TwoCols>
      <TodaySessions title={tr("My workouts today")} />
      <Block
        title={tr("My horses")}
        state={horses}
        action={<Link to="/stables/map">{tr("Stable map →")}</Link>}
        empty={(r) => (r.items.length ? null : tr("You have not been assigned any horse yet."))}
      >
        {(r) => (
          <div>
            {r.items.map((h) => (
              <Line
                key={h.id}
                main={<Link to={`/horses/${h.id}`}>{h.name}</Link>}
                sub={`Stall ${h.stallCode ?? "—"}`}
                right={
                  <span style={{ display: "flex", gap: 6 }}>
                    <HealthBadge status={h.status as HealthStatus} />
                    {h.isMedicalLocked && <Badge tone="danger" icon="lock">{tr("Training Lock")}</Badge>}
                  </span>
                }
              />
            ))}
          </div>
        )}
      </Block>
    </TwoCols>
  );
}

// ------------------------------------------------------------------ Horse Owner

export function OwnerDashboard() {
  const horses = useLoaded(() => getHorses({ limit: 100 }));
  const plans = useLoaded(() => trainingApi.getPlans({ status: "ACTIVE" }));
  return (
    <TwoCols>
      <Block
        title={tr("My horses")}
        state={horses}
        action={<Link to="/my-horses">All →</Link>}
        empty={(r) => (r.items.length ? null : "No horse is registered under your name yet.")}
      >
        {(r) => (
          <div>
            {r.items.map((h) => (
              <Line
                key={h.id}
                main={<Link to={`/horses/${h.id}`}>{h.name}</Link>}
                sub={`${h.breed} · ${h.horseCode ?? ""}`}
                right={
                  <span style={{ display: "flex", gap: 6 }}>
                    <HealthBadge status={h.status as HealthStatus} />
                    {h.isMedicalLocked && <Badge tone="danger" icon="lock">Training Lock</Badge>}
                  </span>
                }
              />
            ))}
          </div>
        )}
      </Block>
      <Block
        title={tr("Training in progress")}
        state={plans}
        action={<Link to="/progress">Training progress →</Link>}
        empty={(list) => (list.length ? null : "No active training plan.")}
      >
        {(list) => (
          <div>
            {list.map((p) => (
              <Line
                key={p.id}
                main={<Link to={`/training/plans/${p.id}`}>{p.horseName}</Link>}
                sub={`${p.name} · until ${formatDate(p.endDate)}`}
                right={`${p.progress.completed}/${p.progress.due} done`}
              />
            ))}
          </div>
        )}
      </Block>
    </TwoCols>
  );
}
