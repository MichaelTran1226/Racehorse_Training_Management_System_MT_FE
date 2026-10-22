import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { Alert } from "@/shared/components/ui/Alert";
import { Segmented } from "@/shared/components/ui/Segmented";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { useCurrentUser } from '@/shared/components/layout/authContext';
import { messageFor } from "@/shared/lib/messages";
import { formatDate, formatDateTime, formatTime } from "@/shared/lib/format";
import { getStalls, getZones } from "@/features/stable/api";
import type { Stall, Zone } from "@/features/stable/types";
import { GridCell, ZoneGrid } from "@/features/stable/components/ZoneGrid";
import { getHealthBoard, type HealthBoardHorse, type HealthBoardResponse } from "../api";
import { Icon } from "@/shared/components/ui/Icon";

import { tr } from "@/shared/i18n/tr";
type Group = HealthBoardHorse["healthGroup"];

/** 4 nhóm màu (Flow 3 §4.1). Ngựa Ngừng quản lý không có trên sơ đồ (BE đã loại). */
const GROUP: Record<Group, { label: string; color: string; bg: string }> = {
  QUALIFIED: { label: "Fit to work", color: "var(--ok)", bg: "var(--ok-bg)" },
  OBSERVATION: { label: "Under observation", color: "var(--warn)", bg: "var(--warn-bg)" },
  INJURED: { label: "Injured", color: "var(--danger)", bg: "var(--danger-bg)" },
  ISOLATED: { label: "Isolated", color: "var(--violet)", bg: "var(--violet-bg)" },
};
const GROUP_ORDER: Group[] = ["QUALIFIED", "OBSERVATION", "INJURED", "ISOLATED"];
const REFRESH_MS = 60_000;

/** SC-3.01 Sơ đồ sức khỏe đàn ngựa (P1-14): CM, HT, VET. Dữ liệu thật từ BE, lỗi thì hiện lỗi (không dùng dữ liệu giả). */
export default function HerdHealthPage() {
  const user = useCurrentUser();
  const isVet = user.role === "VETERINARIAN";

  const [board, setBoard] = useState<HealthBoardResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [view, setView] = useState<"cards" | "stalls">("cards");
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [lockFilter, setLockFilter] = useState("ALL");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setBoard(await getHealthBoard());
      setUpdatedAt(new Date());
      setError("");
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  // Chế độ Theo chuồng: bắt buộc chọn 1 khu.
  useEffect(() => {
    if (view !== "stalls" || zones.length > 0) return;
    getZones()
      .then((z) => {
        setZones(z);
        setZoneId((cur) => cur || z[0]?.id || "");
      })
      .catch((err) => setError(messageFor(err)));
  }, [view, zones.length]);

  useEffect(() => {
    if (view !== "stalls" || !zoneId) return;
    getStalls({ zoneId })
      .then(setStalls)
      .catch((err) => setError(messageFor(err)));
  }, [view, zoneId, updatedAt]);

  const horses = useMemo(() => board?.data ?? [], [board]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return horses.filter(
      (h) =>
        (groups.length === 0 || groups.includes(h.healthGroup)) &&
        (lockFilter === "ALL" || (lockFilter === "LOCKED") === h.isMedicalLocked) &&
        (!overdueOnly || h.hasOverduePreventive) &&
        (!q || h.name.toLowerCase().includes(q) || (h.horseCode ?? "").toLowerCase().includes(q)),
    );
  }, [horses, groups, lockFilter, overdueOnly, search]);
  const byId = useMemo(() => new Map(horses.map((h) => [h.id, h])), [horses]);
  const visible = useMemo(() => new Set(filtered.map((h) => h.id)), [filtered]);
  const selected = selectedId ? (byId.get(selectedId) ?? null) : null;
  const filtersOn = groups.length > 0 || lockFilter !== "ALL" || overdueOnly || !!search;

  function clearFilters() {
    setGroups([]);
    setLockFilter("ALL");
    setOverdueOnly(false);
    setSearch("");
  }

  function toggleGroup(g: Group) {
    setGroups((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));
  }

  const s = board?.summary;
  const cards: Array<{ key: string; label: string; value: number; color: string; onClick: () => void; on: boolean }> = s
    ? [
        ...GROUP_ORDER.map((g) => ({
          key: g,
          label: GROUP[g].label,
          value: { QUALIFIED: s.qualifiedCount, OBSERVATION: s.observationCount, INJURED: s.injuredCount, ISOLATED: s.isolatedCount }[g],
          color: GROUP[g].color,
          onClick: () => toggleGroup(g),
          on: groups.includes(g),
        })),
        {
          key: "LOCK",
          label: "Training Lock",
          value: s.lockedCount,
          color: "var(--danger)",
          onClick: () => setLockFilter((v) => (v === "LOCKED" ? "ALL" : "LOCKED")),
          on: lockFilter === "LOCKED",
        },
        {
          key: "OVERDUE",
          label: "Preventive care overdue",
          value: s.overdueCount,
          color: "var(--warn)",
          onClick: () => setOverdueOnly((v) => !v),
          on: overdueOnly,
        },
      ]
    : [];

  function horseCard(h: HealthBoardHorse) {
    const g = GROUP[h.healthGroup];
    return (
      <button
        key={h.id}
        type="button"
        onClick={() => setSelectedId(h.id)}
        style={{
          textAlign: "left",
          padding: 12,
          borderRadius: "var(--r-lg)",
          background: "var(--surface)",
          border: `${h.isMedicalLocked ? 2 : 1}px solid ${h.isMedicalLocked ? "var(--danger)" : "var(--border)"}`,
          cursor: "pointer",
          display: "grid",
          gap: 4,
          outline: h.id === selectedId ? "2px solid var(--brand)" : undefined,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
          <strong>{h.name}</strong>
          <span>
            {h.isMedicalLocked && (
              <span title={tr("Training Lock")} style={{ color: "var(--danger)", display: "inline-flex" }}>
                <Icon name="lock" size={16} />
                <span className="sr-only">{tr("Training Lock")}</span>
              </span>
            )}
            {h.hasOverduePreventive && (
              <span title={tr("Preventive care overdue")} style={{ color: "var(--warn)", display: "inline-flex" }}>
                <Icon name="bell" size={16} />
                <span className="sr-only">{tr("Preventive care overdue")}</span>
              </span>
            )}
          </span>
        </div>
        <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
          {h.horseCode ?? "—"} {tr("· Stall")}{" "}{h.stallCode ?? "—"}
        </span>
        <span style={{ fontSize: "var(--fs-caption)", background: g.bg, color: g.color, borderRadius: 999, padding: "1px 8px", justifySelf: "start" }}>
          {g.label}
        </span>
        <span style={{ fontSize: "var(--fs-caption)" }}>
          {tr("Open injuries:")} {h.openInjuries.length} {tr("· Last exam:")}{" "}{h.latestRecord ? formatDate(h.latestRecord.examinationDate) : "—"}
        </span>
      </button>
    );
  }

  function panel(h: HealthBoardHorse) {
    const g = GROUP[h.healthGroup];
    return (
      <aside
        style={{
          width: 340,
          flexShrink: 0,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: 16,
          display: "grid",
          gap: 12,
          alignContent: "start",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "var(--fs-section)" }}>{h.name}</h2>
            <span style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)" }}>
              {h.horseCode} {tr("· Stall")}{" "}{h.stallCode ?? "—"}
            </span>
          </div>
          <Button tone="ghost" size="sm" aria-label={tr("Close panel")} icon="x" onClick={() => setSelectedId(null)} />
        </div>
        <span style={{ background: g.bg, color: g.color, borderRadius: 999, padding: "2px 10px", justifySelf: "start" }}>
          {g.label} · {h.status.replace("_", " ").toLowerCase()}
        </span>
        <section>
          <strong>{tr("Training Lock")}</strong>
          {h.lock ? (
            <div style={{ fontSize: "var(--fs-body)" }}>
              {tr("Placed {{date}} by {{vet}}", { date: formatDateTime(h.lock.lockedAt), vet: h.lock.veterinarianName ?? "—" })}
              <br />
              {tr("Review date:")} {h.lock.recheckDate ? formatDate(h.lock.recheckDate) : "—"}
            </div>
          ) : (
            <div style={{ fontSize: "var(--fs-body)" }}>{tr("None")}</div>
          )}
        </section>
        <section>
          <strong>{tr("Latest medical record")}</strong>
          <div style={{ fontSize: "var(--fs-body)" }}>
            {h.latestRecord ? `${formatDate(h.latestRecord.examinationDate)} – ${h.latestRecord.diagnosis}` : tr("None")}
          </div>
        </section>
        <section>
          <strong>{tr("Open injuries")}</strong>
          <div style={{ fontSize: "var(--fs-body)" }}>
            {h.openInjuries.length === 0 ? tr("None") : h.openInjuries.map((i) => `${i.zone} (${i.stage.toLowerCase()})`).join(", ")}
          </div>
        </section>
        <section>
          <strong>{tr("Preventive care due (30 days)")}</strong>
          <div style={{ fontSize: "var(--fs-body)", display: "grid", gap: 2 }}>
            {h.preventiveDue.length === 0
              ? tr("None")
              : h.preventiveDue.map((p) => (
                  <span key={`${p.name}-${p.dueDate}`} style={{ color: p.overdue ? "var(--danger)" : undefined }}>
                    {p.name}: {formatDate(p.dueDate)}
                    {p.overdue ? ` (${tr("overdue")})` : ""}
                  </span>
                ))}
          </div>
        </section>
        <section>
          <strong>{tr("Groom observation (last 24 h)")}</strong>
          <div style={{ fontSize: "var(--fs-body)" }}>
            {h.latestObservation
              ? `${h.latestObservation.text} — ${h.latestObservation.groomName ?? "Groom"}, ${formatTime(h.latestObservation.at)}`
              : tr("None")}
          </div>
        </section>
        <Link to={`/medical/horses/${h.id}`}>
          <Button tone="secondary" block>{tr("Open medical profile")}</Button>
        </Link>
        {isVet &&
          (h.isMedicalLocked ? (
            <Badge tone="danger" icon="lock">{tr("Locked")}</Badge>
          ) : (
            <Link to="/medical/locks">
              <Button block>{tr("Place Training Lock")}</Button>
            </Link>
          ))}
      </aside>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title={tr("Herd health")}
        description={updatedAt ? tr("Updated at {{time}}", { time: formatTime(updatedAt) }) : undefined}
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Segmented
              label={tr("View")}
              items={[
                { id: "cards", label: tr("Cards") },
                { id: "stalls", label: tr("By stall") },
              ]}
              active={view}
              onChange={setView}
            />
            {isVet && (
              <Link to="/medical/locks">
                <Button tone="secondary">{tr("Training Locks")}</Button>
              </Link>
            )}
          </div>
        }
      />

      {error && (
        <Alert tone="danger" title={tr("Could not load data.")} action={<Button size="sm" onClick={() => void load()}>{tr("Try again")}</Button>}>
          {error}
        </Alert>
      )}

      {s && (
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {cards.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={c.on}
              onClick={c.onClick}
              style={{
                minWidth: 150,
                padding: "10px 14px",
                textAlign: "left",
                borderRadius: "var(--r-lg)",
                background: "var(--surface)",
                border: `${c.on ? 2 : 1}px solid ${c.on ? c.color : "var(--border)"}`,
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>{c.label}</div>
              <div style={{ fontSize: "var(--fs-kpi)", fontWeight: 700, color: c.color }}>{c.value}</div>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ width: 240 }}>
          <Input placeholder={tr("Horse name or code")} aria-label={tr("Find a horse")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ width: 170 }}>
          <Select
            aria-label={tr("Training Lock")}
            value={lockFilter}
            onChange={(e) => setLockFilter(e.target.value)}
            options={[
              { value: "ALL", label: tr("Lock: all") },
              { value: "LOCKED", label: tr("Locked") },
              { value: "UNLOCKED", label: tr("Not locked") },
            ]}
          />
        </div>
        {view === "stalls" && zones.length > 0 && (
          <div style={{ width: 200 }}>
            <Select
              aria-label={tr("Barn zone")}
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              options={zones.map((z) => ({ value: z.id, label: z.name }))}
            />
          </div>
        )}
        <Checkbox checked={overdueOnly} onChange={setOverdueOnly} label={tr("Preventive care overdue")} />
        {filtersOn && (
          <Button tone="ghost" size="sm" onClick={clearFilters}>{tr("Clear filters")}</Button>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>{tr("Loading herd health…")}</div>
          ) : horses.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", border: "2px dashed var(--border)", borderRadius: "var(--r-lg)" }}>{tr("No horses yet.")}</div>
          ) : filtered.length === 0 && view === "cards" ? (
            <div style={{ padding: 40, textAlign: "center", border: "2px dashed var(--border)", borderRadius: "var(--r-lg)" }}>
              {tr("No horse matches the filters.")}
            </div>
          ) : view === "cards" ? (
            <div style={{ display: "grid", gap: 16 }}>
              {GROUP_ORDER.map((g) => {
                const list = filtered.filter((h) => h.healthGroup === g);
                if (list.length === 0) return null;
                return (
                  <section key={g}>
                    <h3 style={{ margin: "0 0 8px", color: GROUP[g].color, fontSize: "var(--fs-body-lg)" }}>
                      {GROUP[g].label} ({list.length})
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                      {list.map(horseCard)}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            (() => {
              const zone = zones.find((z) => z.id === zoneId);
              if (!zone) return <div style={{ padding: 40, textAlign: "center" }}>{tr("No barn zones yet.")}</div>;
              return (
                <ZoneGrid
                  zone={zone}
                  stalls={stalls}
                  renderCell={(st) => {
                    const a = st.allocations[0];
                    const h = a ? byId.get(a.horse.id) : undefined;
                    if (!h) {
                      return (
                        <GridCell
                          code={st.code}
                          look={st.status === "MAINTENANCE" ? { title: tr("Maintenance"), striped: true } : { title: tr("Empty"), dashed: true }}
                        />
                      );
                    }
                    const g = GROUP[h.healthGroup];
                    return (
                      <GridCell
                        code={st.code}
                        selected={h.id === selectedId}
                        look={{ title: h.name, subtitle: g.label, bg: g.bg, fg: g.color, locked: h.isMedicalLocked, dimmed: !visible.has(h.id) }}
                        onClick={() => setSelectedId(h.id)}
                      />
                    );
                  }}
                />
              );
            })()
          )}
        </div>
        {selected && panel(selected)}
      </div>
    </div>
  );
}
