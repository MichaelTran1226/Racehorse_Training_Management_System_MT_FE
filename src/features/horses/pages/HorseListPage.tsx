import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { useCurrentUser } from '@/shared/components/layout/authContext';
import { Card } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Button, LinkButton } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { Alert } from "@/shared/components/ui/Alert";
import { DataTable, type Column } from "@/shared/components/ui/DataTable";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { HealthBadge } from "@/shared/components/ui/HealthBadge";
import { Menu } from "@/shared/components/ui/Menu";
import { Pagination } from "@/shared/components/ui/Pagination";
import { Tabs } from "@/shared/components/ui/Tabs";
import { messageFor } from "@/shared/lib/messages";
import type { HealthStatus, HorseStatus } from "@/shared/types/enums";
import { getHorseCatalog, getHorses } from "../api";
import type { Horse, HorseListFilter } from "../types";

import { tr } from "@/shared/i18n/tr";
import { isVietnamese } from "@/shared/lib/language";
const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "ACTIVE", label: "Ready to Race" },
  { id: "IN_TRAINING", label: "In Training" },
  { id: "UNDER_OBSERVATION", label: "Under Observation" },
  { id: "INJURED", label: "Injured" },
  { id: "ISOLATED", label: "Isolated" },
  { id: "RESTING", label: "Resting" },
  { id: "RETIRED", label: "Retired" },
];

const GENDER_OPTIONS = [
  { value: "ALL", label: "Sex: All" },
  { value: "Stallion", label: "Stallion" },
  { value: "Mare", label: "Mare" },
  { value: "Gelding", label: "Gelding" },
];

const LOCK_OPTIONS = [
  { value: "ALL", label: "Training Lock: Any" },
  { value: "true", label: "Under Training Lock" },
  { value: "false", label: "Not locked" },
];

const SORT_OPTIONS = [
  { value: "name_asc", label: "Sort: Name A–Z" },
  { value: "name_desc", label: "Sort: Name Z–A" },
  { value: "horseCode_asc", label: "Sort: Horse ID" },
  { value: "status_asc", label: "Sort: Status" },
  { value: "dob_desc", label: "Sort: Youngest first" },
  { value: "dob_asc", label: "Sort: Oldest first" },
];

/** Tuổi tròn năm tính theo ngày sinh. */
function ageOf(dob?: string): string {
  if (!dob) return "—";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age -= 1;
  const num = Math.max(age, 0);
  return `${num} ${isVietnamese() ? "tuổi" : "y"}`;
}

/** Mã 15 số tách nhóm 3 cho dễ đọc: 985 141 002 341 001. */
function groupDigits(code: string): string {
  return /^\d{15}$/.test(code) ? code.replace(/(\d{3})(?=\d)/g, "$1 ") : code;
}

export default function HorseListPage() {
  const currentUser = useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state from URL
  const querySearch = searchParams.get("search") || "";
  const queryStatus = searchParams.get("status") || "ALL";
  const queryLock = searchParams.get("lock") || "ALL";
  const queryGender = searchParams.get("gender") || "ALL";
  const queryBreed = searchParams.get("breed") || "ALL";
  const queryNoStall = searchParams.get("noStall") === "true";
  const querySort = searchParams.get("sort") || "name_asc";
  const queryPage = parseInt(searchParams.get("page") || "1", 10);
  const queryLimit = parseInt(searchParams.get("limit") || "20", 10);

  const [searchInput, setSearchInput] = useState(querySearch);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [breedOptions, setBreedOptions] = useState([{ value: "ALL", label: "Breed: All" }]);

  // Bộ lọc Giống lấy từ danh mục SC-1.06 (cả mục đã ngừng dùng, vì ngựa cũ vẫn mang giá trị đó).
  useEffect(() => {
    getHorseCatalog("BREED", "ALL")
      .then((items) => setBreedOptions([{ value: "ALL", label: "Breed: All" }, ...items.map((i) => ({ value: i.name, label: i.name }))]))
      .catch(() => undefined);
  }, []);

  const isOwner = currentUser.role === "HORSE_OWNER";
  const isGroom = currentUser.role === "GROOM";
  const canEdit = currentUser.permissions.editHorses || currentUser.role === "CLUB_MANAGER";
  // C1-03: VET, GROOM không thấy chủ sở hữu. C1-04: nút y tế chỉ cho CM, HT, VET.
  const showOwner = !["VETERINARIAN", "GROOM", "HORSE_OWNER"].includes(currentUser.role);
  const showStall = !isOwner;
  const canSeeMedical = ["CLUB_MANAGER", "HEAD_TRAINER", "VETERINARIAN"].includes(currentUser.role);
  const filtered =
    Boolean(querySearch) || queryStatus !== "ALL" || queryLock !== "ALL" || queryGender !== "ALL" || queryBreed !== "ALL" || queryNoStall;

  // URLSearchParams updater
  const updateUrl = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, val] of Object.entries(newParams)) {
          if (val === undefined || val === "" || val === "ALL" || (key === "page" && val === 1)) {
            next.delete(key);
          } else {
            next.set(key, String(val));
          }
        }
        return next;
      });
    },
    [setSearchParams],
  );

  // Debounced search (400ms per FR-1.03)
  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      updateUrl({ search: val.trim() || undefined, page: 1 });
    }, 400);
  }

  const loadData = useCallback(() => {
    setLoading(true);
    setError("");

    const [sortBy, sortOrder] = querySort.split("_") as [string, "asc" | "desc"];
    const filter: HorseListFilter = {
      search: querySearch || undefined,
      status: queryStatus !== "ALL" ? (queryStatus as HorseStatus) : undefined,
      isMedicalLocked: queryLock !== "ALL" ? queryLock : undefined,
      gender: queryGender !== "ALL" ? queryGender : undefined,
      breed: queryBreed !== "ALL" ? queryBreed : undefined,
      noStall: queryNoStall ? "true" : undefined,
      sortBy,
      sortOrder,
      page: queryPage,
      limit: queryLimit,
    };

    getHorses(filter)
      .then((res) => {
        setHorses(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        setError(messageFor(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [querySearch, queryStatus, queryLock, queryGender, queryBreed, queryNoStall, querySort, queryPage, queryLimit]);

  useEffect(() => {
    queueMicrotask(() => {
      loadData();
    });
  }, [loadData]);

  function resetFilters() {
    setSearchInput("");
    setSearchParams(new URLSearchParams());
  }

  const columns: Column<Horse>[] = [
    {
      key: "horse",
      header: "Horse",
      render: (h) => (
        <div style={{ display: "grid", minWidth: 0 }}>
          <Link to={`/horses/${h.id}`} className="nowrap" style={{ fontWeight: 600, color: "var(--text)" }}>
            {h.name}
          </Link>
          <span className="num nowrap" style={{ fontSize: "var(--fs-caption)", lineHeight: "18px", color: "var(--muted)" }}>
            {h.horseCode ? `${h.horseCode} · ` : ""}
            {h.breed}
          </span>
        </div>
      ),
    },
    {
      key: "sex",
      header: "Sex · Age",
      render: (h) => (
        <span className="num nowrap">
          {h.gender ? tr(h.gender) : "—"} · {ageOf(h.dob)}
        </span>
      ),
    },
    ...(showStall
      ? [
          {
            key: "stall",
            header: "Stall",
            render: (h: Horse) =>
              h.stallCode ? (
                <div style={{ display: "grid" }}>
                  <span className="num nowrap" style={{ fontWeight: 600 }}>
                    {h.stallCode}
                  </span>
                  {h.zone && (
                    <span className="nowrap" style={{ fontSize: "var(--fs-caption)", lineHeight: "18px", color: "var(--muted)" }}>
                      {h.zone}
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ color: "var(--muted)" }}>{tr("Not assigned")}</span>
              ),
          },
        ]
      : []),
    ...(showOwner
      ? [
          {
            key: "owner",
            header: "Owner",
            render: (h: Horse) => <span className="nowrap">{h.owner?.fullName ?? h.ownerName ?? "—"}</span>,
          },
        ]
      : []),
    {
      key: "status",
      header: "Status",
      render: (h) =>
        h.status ? <HealthBadge status={h.status as HealthStatus} /> : <span style={{ color: "var(--muted)" }}>—</span>,
    },
    {
      key: "lock",
      header: "Training Lock",
      render: (h) =>
        h.isMedicalLocked ? (
          <Badge tone="danger" icon="lock">
            {tr("Locked")}
          </Badge>
        ) : (
          <span style={{ color: "var(--muted)" }} aria-label={tr("Not locked")}>
            —
          </span>
        ),
    },
    {
      key: "chip",
      header: "Microchip",
      hideOnNarrow: true,
      render: (h) => {
        let chip = h.microchip || h.microchipRfid || "—";
        if (isGroom && chip !== "—" && chip.length > 4) chip = "*".repeat(chip.length - 4) + chip.slice(-4);
        return (
          <span className="num nowrap" style={{ color: "var(--text-2)" }}>
            {groupDigits(chip)}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      width: 56,
      align: "right",
      render: (h) => (
        <Menu
          label={tr(`Actions for ${h.name}`)}
          items={[
            { label: tr("View profile"), icon: "eye", to: `/horses/${h.id}` },
            { label: tr("Medical records"), icon: "file", to: `/medical/horses/${h.id}`, hidden: !canSeeMedical },
            { label: tr("Fitness chart"), icon: "chart", to: `/horses/${h.id}/fitness`, hidden: isOwner },
            { label: tr("Edit profile"), icon: "edit", to: `/horses/${h.id}/edit`, hidden: !canEdit || h.status === "RETIRED" },
          ]}
        />
      ),
    },
  ];

  const emptyTitle = filtered
    ? tr("No horses match these filters")
    : isOwner
      ? tr("No horses are registered under your name yet")
      : isGroom
        ? tr("No horses are assigned to you yet")
        : tr("No horses registered yet");
  const emptyText = filtered
    ? tr("Remove a filter or clear them all.")
    : canEdit
      ? tr("Register a horse with its microchip number to start assigning stalls, training plans and vet care.")
      : tr("The Club Manager registers new horses and assigns them.");

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <PageHeader
        title={isOwner ? tr("My horses") : tr("Horses")}
        description={
          loading || error
            ? tr("Identity, stall, status and Training Lock of every managed horse.")
            : isVietnamese()
              ? `${total} ngựa ${filtered ? "khớp bộ lọc" : "được quản lý"}.`
              : `${total} ${total === 1 ? "horse" : "horses"}${filtered ? " match the current filters" : " managed"}.`
        }
        action={
          <>
            {currentUser.role === "CLUB_MANAGER" && (
              <LinkButton to="/horses/deleted" icon="trash">
                {tr("Deleted horses")}
              </LinkButton>
            )}
            {canEdit && (
              <LinkButton to="/horses/new" tone="primary" icon="plus">
                {tr("Register horse")}
              </LinkButton>
            )}
          </>
        }
      />

      <Card pad={0}>
        <div style={{ padding: "0 20px", borderBottom: "1px solid var(--border)" }}>
          <Tabs
            label={tr("Filter by status")}
            items={STATUS_FILTERS.map((s) => ({
              id: s.id,
              label: s.label,
              count: s.id === queryStatus && !loading && !error ? total : undefined,
            }))}
            active={queryStatus}
            onChange={(id) => updateUrl({ status: id, page: 1 })}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", padding: "16px 20px" }}>
          <div style={{ flex: "1 1 240px", maxWidth: 320 }}>
            <Input
              icon="search"
              aria-label={tr("Search horses")}
              placeholder={tr("Name, HR code, microchip or RFID")}
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div style={{ width: 160 }}>
            <Select aria-label={tr("Breed")} value={queryBreed} options={breedOptions} onChange={(e) => updateUrl({ breed: e.target.value, page: 1 })} />
          </div>
          <div style={{ width: 130 }}>
            <Select aria-label={tr("Sex")} value={queryGender} options={GENDER_OPTIONS} onChange={(e) => updateUrl({ gender: e.target.value, page: 1 })} />
          </div>
          <div style={{ width: 190 }}>
            <Select
              aria-label={tr("Training Lock")}
              value={queryLock}
              options={LOCK_OPTIONS}
              onChange={(e) => updateUrl({ lock: e.target.value, page: 1 })}
            />
          </div>
          {(currentUser.role === "CLUB_MANAGER" || currentUser.role === "HEAD_TRAINER") && (
            <Checkbox checked={queryNoStall} onChange={(v) => updateUrl({ noStall: v ? "true" : undefined, page: 1 })} label={tr("No stall yet")} />
          )}
          <div style={{ width: 180, marginLeft: "auto" }}>
            <Select aria-label={tr("Sort")} value={querySort} options={SORT_OPTIONS} onChange={(e) => updateUrl({ sort: e.target.value, page: 1 })} />
          </div>
          {filtered && (
            <Button tone="ghost" size="sm" icon="x" onClick={resetFilters}>
              {tr("Clear filters")}
            </Button>
          )}
        </div>

        {error ? (
          <div style={{ padding: "0 20px 20px" }}>
            <Alert
              tone="danger"
              title={tr("Couldn’t load the horse list")}
              action={
                <Button size="sm" tone="secondary" onClick={loadData}>
                  Try again
                </Button>
              }
            >
              {tr(error)} {tr("Your search and filters are kept.")}
            </Alert>
          </div>
        ) : (
          <div style={{ borderTop: "1px solid var(--border)" }}>
            <DataTable
              caption={tr("Horses")}
              columns={columns}
              rows={horses}
              rowKey={(h) => h.id}
              loading={loading}
              empty={
                <EmptyState
                  icon="horse"
                  title={emptyTitle}
                  description={emptyText}
                  action={
                    filtered ? (
                      <Button tone="secondary" onClick={resetFilters}>
                        Clear all filters
                      </Button>
                    ) : canEdit ? (
                      <LinkButton to="/horses/new" tone="primary" icon="plus">
                        Register horse
                      </LinkButton>
                    ) : undefined
                  }
                />
              }
            />
          </div>
        )}

        {!loading && !error && total > queryLimit && (
          <Pagination page={queryPage} pageSize={queryLimit} total={total} noun="horses" onPage={(p) => updateUrl({ page: p })} />
        )}
      </Card>
    </div>
  );
}
