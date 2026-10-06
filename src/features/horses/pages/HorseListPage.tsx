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
  { id: "ALL", label: "Tất cả" },
  { id: "ACTIVE", label: "Sẵn sàng thi đấu" },
  { id: "IN_TRAINING", label: "Đang tập luyện" },
  { id: "UNDER_OBSERVATION", label: "Cần theo dõi" },
  { id: "INJURED", label: "Chấn thương" },
  { id: "ISOLATED", label: "Cách ly" },
  { id: "RESTING", label: "Nghỉ ngơi" },
  { id: "RETIRED", label: "Ngừng quản lý" },
];

const GENDER_OPTIONS = [
  { value: "ALL", label: "Tất cả giới tính" },
  { value: "Colt", label: "Colt (Đực non)" },
  { value: "Stallion", label: "Stallion (Đực giống)" },
  { value: "Gelding", label: "Gelding (Đực thiến)" },
  { value: "Filly", label: "Filly (Cái non)" },
  { value: "Mare", label: "Mare (Cái trưởng thành)" },
];

const LOCK_OPTIONS = [
  { value: "ALL", label: "Tất cả khóa y tế" },
  { value: "true", label: "Đang khóa huấn luyện" },
  { value: "false", label: "Không khóa" },
];

const SORT_OPTIONS = [
  { value: "name_asc", label: "Tên ngựa (A → Z)" },
  { value: "name_desc", label: "Tên ngựa (Z → A)" },
  { value: "horseCode_asc", label: "Mã ngựa (Tăng dần)" },
  { value: "status_asc", label: "Trạng thái sức khỏe" },
  { value: "dob_desc", label: "Tuổi (Trẻ nhất trước)" },
  { value: "dob_asc", label: "Tuổi (Lớn nhất trước)" },
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
        setError(err.message || "Không thể tải danh sách ngựa. Vui lòng thử lại.");
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
          setError(err.message || "Không thể tải danh sách ngựa. Vui lòng thử lại.");
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
        eyebrow="HỒ SƠ ĐÀN NGỰA · FLOW 1"
        title="Danh Sách Quản Lý Đàn Ngựa"
        description="Quản lý toàn bộ hồ sơ định danh, thông tin giống, số microchip/RFID, phân bổ chuồng trại và trạng thái sức khỏe."
        action={
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/herd">
              <Button tone="secondary" size="md">
                Sơ Đồ Sức Khỏe Đàn Ngựa
              </Button>
            </Link>
            {canEdit && (
              <Link to="/horses/new">
                <Button tone="primary" size="md">
                  + Thêm Ngựa Mới
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
                placeholder="Tìm theo tên ngựa, mã ngựa, microchip, RFID..."
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
                  Xóa bộ lọc
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
          title="Không tải được dữ liệu"
          action={
            <Button size="sm" tone="secondary" onClick={loadData}>
              Thử lại
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
            Đang tải danh sách ngựa...
          </p>
        </Card>
      ) : horses.length === 0 ? (
        <Card pad={32}>
          <EmptyState
            title={
              querySearch || queryStatus !== "ALL" || queryLock !== "ALL" || queryGender !== "ALL"
                ? "Không có ngựa phù hợp với bộ lọc"
                : isOwner
                  ? "Chưa có ngựa nào thuộc sở hữu của bạn"
                  : isGroom
                    ? "Bạn chưa được phân công chăm sóc ngựa nào"
                    : "Chưa có hồ sơ ngựa nào trong hệ thống"
            }
            description={
              querySearch || queryStatus !== "ALL"
                ? "Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh lại các tiêu chí bộ lọc."
                : canEdit
                  ? "Bấm vào nút '+ Thêm Ngựa Mới' ở góc trên để bắt đầu khởi tạo hồ sơ định danh đầu tiên."
                  : "Vui lòng liên hệ Quản lý câu lạc bộ để được hỗ trợ phân bổ."
            }
            action={
              (querySearch || queryStatus !== "ALL" || queryLock !== "ALL") ? (
                <Button tone="secondary" onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              ) : canEdit ? (
                <Link to="/horses/new">
                  <Button tone="primary">+ Thêm Ngựa Mới</Button>
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
                        {horse.isMedicalLocked && <Badge tone="danger">Khóa huấn luyện</Badge>}
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
                        <strong>Giới tính:</strong> {horse.gender}
                      </div>
                      <div>
                        <strong>Màu lông:</strong> {horse.color}
                      </div>
                      {!isOwner && (
                        <div>
                          <strong>Ô chuồng:</strong> {horse.stallCode || "Chưa gán"}
                        </div>
                      )}
                      <div>
                        <strong>Ngày sinh:</strong> {horse.dob ? horse.dob.split("T")[0] : "—"}
                      </div>
                    </div>

                    <div style={{ marginTop: "0.5rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border, #e2e8f0)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <Link
                        to={`/horses/${horse.id}`}
                        style={{ fontSize: "0.8125rem", color: "var(--brand, #16a34a)", fontWeight: 600, textDecoration: "none" }}
                      >
                        Chi tiết hồ sơ →
                      </Link>

                      <div style={{ display: "flex", gap: "0.75rem" }}>
                        <Link
                          to={`/medical/horses/${horse.id}`}
                          style={{ fontSize: "0.8125rem", color: "var(--accent, #2563eb)", textDecoration: "none" }}
                        >
                          Bệnh án
                        </Link>
                        {canEdit && horse.status !== "RETIRED" && (
                          <Link
                            to={`/horses/${horse.id}/edit`}
                            style={{ fontSize: "0.8125rem", color: "var(--ink-muted, #64748b)", textDecoration: "none" }}
                          >
                            Sửa
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
                noun="ngựa"
                onPage={(p) => updateUrl({ page: p })}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
