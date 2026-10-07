import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { Card } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Alert } from "@/shared/components/ui/Alert";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Pagination } from "@/shared/components/ui/Pagination";
import { HEALTH_STATUS } from "@/shared/lib/status";
import type { HealthStatus, HorseStatus } from "@/shared/types/enums";
import { getHorses } from "../api";
import type { Horse, HorseListFilter } from "../types";

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "ACTIVE", label: "Fit for Competition" },
  { id: "IN_TRAINING", label: "In Training" },
  { id: "UNDER_OBSERVATION", label: "Under Observation" },
  { id: "INJURED", label: "Injured" },
  { id: "ISOLATED", label: "Isolated" },
  { id: "RESTING", label: "Resting" },
  { id: "RETIRED", label: "Retired" },
];

const GENDER_OPTIONS = [
  { value: "ALL", label: "All Genders" },
  { value: "Colt", label: "Colt" },
  { value: "Stallion", label: "Stallion" },
  { value: "Gelding", label: "Gelding" },
  { value: "Filly", label: "Filly" },
  { value: "Mare", label: "Mare" },
];

const LOCK_OPTIONS = [
  { value: "ALL", label: "All Medical Locks" },
  { value: "true", label: "Training Locked" },
  { value: "false", label: "Unlocked" },
];

const SORT_OPTIONS = [
  { value: "name_asc", label: "Horse Name (A → Z)" },
  { value: "name_desc", label: "Horse Name (Z → A)" },
  { value: "horseCode_asc", label: "Horse Code (Ascending)" },
  { value: "status_asc", label: "Health Status" },
  { value: "dob_desc", label: "Age (Youngest First)" },
  { value: "dob_asc", label: "Age (Oldest First)" },
];

export default function HorseListPage() {
  const currentUser = useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();

  // Đọc state từ URL
  const querySearch = searchParams.get("search") || "";
  const queryStatus = searchParams.get("status") || "ALL";
  const queryLock = searchParams.get("lock") || "ALL";
  const queryGender = searchParams.get("gender") || "ALL";
  const querySort = searchParams.get("sort") || "name_asc";
  const queryPage = parseInt(searchParams.get("page") || "1", 10);
  const queryLimit = parseInt(searchParams.get("limit") || "20", 10);

  const [searchInput, setSearchInput] = useState(querySearch);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isOwner = currentUser.role === "HORSE_OWNER";
  const isGroom = currentUser.role === "GROOM";
  const canEdit = currentUser.permissions.editHorses || currentUser.role === "CLUB_MANAGER";

  // Cập nhật URLSearchParams
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

  // Debounce tìm kiếm 400ms theo spec FR-1.03
  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      updateUrl({ search: val.trim() || undefined, page: 1 });
    }, 400);
  }

  const loadData = useCallback(() => {
    setError("");

    const [sortBy, sortOrder] = querySort.split("_") as [string, "asc" | "desc"];
    const filter: HorseListFilter = {
      search: querySearch || undefined,
      status: queryStatus !== "ALL" ? (queryStatus as HorseStatus) : undefined,
      isMedicalLocked: queryLock !== "ALL" ? queryLock : undefined,
      gender: queryGender !== "ALL" ? queryGender : undefined,
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
        setError(err.message || "Failed to load horse list. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [querySearch, queryStatus, queryLock, queryGender, querySort, queryPage, queryLimit]);

  useEffect(() => {
    let ignore = false;
    const [sortBy, sortOrder] = querySort.split("_") as [string, "asc" | "desc"];
    const filter: HorseListFilter = {
      search: querySearch || undefined,
      status: queryStatus !== "ALL" ? (queryStatus as HorseStatus) : undefined,
      isMedicalLocked: queryLock !== "ALL" ? queryLock : undefined,
      gender: queryGender !== "ALL" ? queryGender : undefined,
      sortBy,
      sortOrder,
      page: queryPage,
      limit: queryLimit,
    };

    getHorses(filter)
      .then((res) => {
        if (!ignore) {
          setHorses(res.items);
          setTotal(res.total);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || "Failed to load horse list. Please try again.");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [querySearch, queryStatus, queryLock, queryGender, querySort, queryPage, queryLimit]);

  function resetFilters() {
    setSearchInput("");
    setSearchParams(new URLSearchParams());
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PageHeader
        title="Horse Directory"
        action={
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/herd">
              <Button tone="secondary" size="md">
                Herd Health Map
              </Button>
            </Link>
            {canEdit && (
              <Link to="/horses/new">
                <Button tone="primary" size="md">
                  + New Horse
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Thanh công cụ lọc & tìm kiếm */}
      <Card pad={16}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Hàng 1: Tabs trạng thái nhanh */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {STATUS_FILTERS.map((st) => (
              <Button
                key={st.id}
                size="sm"
                tone={queryStatus === st.id ? "primary" : "secondary"}
                onClick={() => updateUrl({ status: st.id, page: 1 })}
              >
                {st.label}
              </Button>
            ))}
          </div>

          {/* Hàng 2: Ô tìm kiếm + Bộ lọc chi tiết */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ gridColumn: "span 2", minWidth: 260 }}>
              <Input
                placeholder="Search by horse name, code, microchip, RFID..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <Select
              value={queryLock}
              options={LOCK_OPTIONS}
              onChange={(e) => updateUrl({ lock: e.target.value, page: 1 })}
            />

            <Select
              value={queryGender}
              options={GENDER_OPTIONS}
              onChange={(e) => updateUrl({ gender: e.target.value, page: 1 })}
            />

            <Select
              value={querySort}
              options={SORT_OPTIONS}
              onChange={(e) => updateUrl({ sort: e.target.value, page: 1 })}
            />

            {(querySearch || queryStatus !== "ALL" || queryLock !== "ALL" || queryGender !== "ALL") && (
              <div>
                <Button tone="secondary" size="sm" onClick={resetFilters}>
                  Reset filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Hiển thị lỗi có nút Thử lại */}
      {error && (
        <Alert
          tone="danger"
          title="Failed to load horses"
          action={
            <Button size="sm" tone="secondary" onClick={loadData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Nội dung danh sách */}
      {loading ? (
        <Card pad={32}>
          <p style={{ textAlign: "center", color: "var(--ink-muted, #64748b)" }}>
            Loading horses...
          </p>
        </Card>
      ) : horses.length === 0 ? (
        <Card pad={32}>
          <EmptyState
            title={
              querySearch || queryStatus !== "ALL" || queryLock !== "ALL" || queryGender !== "ALL"
                ? "No horses match the selected filters"
                : isOwner
                  ? "No horses currently owned by you"
                  : isGroom
                    ? "No horses assigned to your care"
                    : "No horse records found in the system"
            }
            description={
              querySearch || queryStatus !== "ALL" || queryLock !== "ALL" || queryGender !== "ALL"
                ? "Try adjusting your search terms or filter criteria."
                : canEdit
                  ? "Click '+ New Horse' above to register your first horse profile."
                  : "Please contact the Club Manager for horse allocation."
            }
            action={
              (querySearch || queryStatus !== "ALL" || queryLock !== "ALL" || queryGender !== "ALL") ? (
                <Button tone="secondary" onClick={resetFilters}>
                  Reset filters
                </Button>
              ) : canEdit ? (
                <Link to="/horses/new">
                  <Button tone="primary">+ New Horse</Button>
                </Link>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
            {horses.map((horse) => {
              const statusCfg = HEALTH_STATUS[horse.status as HealthStatus] || {
                label: horse.status,
                tone: "neutral",
              };

              let displayMicrochip = horse.microchip || horse.microchipRfid || "—";
              if (isGroom && displayMicrochip !== "—" && displayMicrochip.length > 4) {
                displayMicrochip = "*".repeat(displayMicrochip.length - 4) + displayMicrochip.slice(-4);
              }

              return (
                <Card key={horse.id} pad={20}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
                          <Link
                            to={`/horses/${horse.id}`}
                            style={{ color: "inherit", textDecoration: "none" }}
                          >
                            {horse.name}
                          </Link>
                        </h3>
                        <span style={{ fontSize: "0.8125rem", color: "var(--ink-muted, #64748b)" }}>
                          {horse.horseCode ? `${horse.horseCode} · ` : ""}{horse.breed}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                        <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
                        {horse.isMedicalLocked && <Badge tone="danger">Training Locked</Badge>}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--ink-muted, #64748b)" }}>
                      <div>
                        <strong>Microchip:</strong>{" "}
                        <span style={{ fontFamily: "monospace" }}>{displayMicrochip}</span>
                      </div>
                      <div>
                        <strong>RFID:</strong>{" "}
                        <span style={{ fontFamily: "monospace" }}>{horse.rfid || "—"}</span>
                      </div>
                      <div>
                        <strong>Gender:</strong> {horse.gender}
                      </div>
                      <div>
                        <strong>Coat Color:</strong> {horse.color}
                      </div>
                      {!isOwner && (
                        <div>
                          <strong>Stall:</strong> {horse.stallCode || "Unassigned"}
                        </div>
                      )}
                      <div>
                        <strong>DOB:</strong> {horse.dob ? horse.dob.split("T")[0] : "—"}
                      </div>
                    </div>

                    <div style={{ marginTop: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border, #e2e8f0)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <Link
                        to={`/horses/${horse.id}`}
                        style={{ fontSize: "0.8125rem", color: "var(--brand, #16a34a)", fontWeight: 600, textDecoration: "none" }}
                      >
                        View Profile →
                      </Link>

                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <Link
                          to={`/medical/horses/${horse.id}`}
                          style={{ fontSize: "0.8125rem", color: "var(--accent, #2563eb)", textDecoration: "none" }}
                        >
                          Medical Record
                        </Link>
                        {canEdit && horse.status !== "RETIRED" && (
                          <Link
                            to={`/horses/${horse.id}/edit`}
                            style={{ fontSize: "0.8125rem", color: "var(--ink-muted, #64748b)", textDecoration: "none" }}
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Phân trang */}
          {total > queryLimit && (
            <div style={{ marginTop: "1rem" }}>
              <Pagination
                page={queryPage}
                pageSize={queryLimit}
                total={total}
                noun="horses"
                onPage={(p) => updateUrl({ page: p })}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
