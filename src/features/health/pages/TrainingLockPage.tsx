import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Icon } from "@/shared/components/ui/Icon";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { healthApi } from "../api";
import { TrainingLockModal } from "../components/TrainingLockModal";
import type { TrainingLockHistoryItem } from "../types";
import { getHorses } from "@/features/horses/api";

export default function TrainingLockPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isVet = user?.role === "VETERINARIAN";

  const [activeTab, setActiveTab] = useState<string>("ACTIVE");
  const [locks, setLocks] = useState<TrainingLockHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchSuggestionsOpen, setSearchSuggestionsOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [selectedLock, setSelectedLock] = useState<TrainingLockHistoryItem | null>(null);
  const [modalMode, setModalMode] = useState<"place" | "extend" | "lift" | null>(null);

  const [horses, setHorses] = useState<any[]>([]);

  useEffect(() => {
    getHorses({ limit: 500 }).then((res) => setHorses(res.items || []));
  }, []);

  // Close filter dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadLocks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await healthApi.getLocks();
      setLocks(data);
    } catch {
      toast.show("Failed to load training locks", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadLocks();
  }, [loadLocks]);

  useEffect(() => {
    const handleSync = () => {
      void loadLocks();
    };
    window.addEventListener("horsesUpdated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("horsesUpdated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [loadLocks]);

  const filteredLocks = locks.filter((item) => {
    const matchesTab = activeTab === "ALL" ? true : item.status === activeTab;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.horseId?.toLowerCase().includes(q) ||
      (item.horseName && item.horseName.toLowerCase().includes(q)) ||
      (item.lockReason && item.lockReason.toLowerCase().includes(q)) ||
      (item.lockCode && item.lockCode.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 700 }}>Medical Training Lock Management</h1>
        </div>

        {isVet && (
          <Button
            tone="danger"
            onClick={() => {
              setSelectedLock(null);
              setModalMode("place");
            }}
          >
            + Place New Training Lock
          </Button>
        )}
      </div>

      {/* Horse Lock Management Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #ede8e3",
          borderRadius: 18,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Card Header */}
        <div
          style={{
            padding: "1.15rem 1.35rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            borderBottom: "1px solid #f2ede8",
          }}
        >
          {/* Left: Shield-Lock Badge & Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: "#fbf1e8",
                border: "1px solid #eed9cb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L4 5.5v5.5c0 5.5 3.5 10.5 8 12 4.5-1.5 8-6.5 8-12V5.5L12 2z"
                  fill="#422013"
                />
                <circle cx="12" cy="10.5" r="1.75" fill="#fbf1e8" />
                <path d="M11 11.8h2l.5 3.5h-3l.5-3.5z" fill="#fbf1e8" />
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#1a1615", letterSpacing: "-0.01em" }}>
                Horse Lock Management
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#786e68" }}>
                Manage lock records, health status and veterinary reviews.
              </p>
            </div>
          </div>

          {/* Right: Search & Filter Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
            {/* Search Input with In-Table Suggestions Popover */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }} ref={searchContainerRef}>
              <span style={{ position: "absolute", left: 11, color: "#8c827a", display: "flex", pointerEvents: "none" }}>
                <Icon name="search" size={14} />
              </span>
              <input
                type="text"
                placeholder="Search horse ID, lock code..."
                value={search}
                onFocus={() => setSearchSuggestionsOpen(true)}
                onClick={() => setSearchSuggestionsOpen(true)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchSuggestionsOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearchSuggestionsOpen(false);
                }}
                style={{
                  width: 240,
                  height: 36,
                  padding: "0 12px 0 34px",
                  borderRadius: 9,
                  border: "1px solid #e2ddd7",
                  background: "#ffffff",
                  fontSize: "0.8rem",
                  color: "#221815",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: 8,
                    background: "none",
                    border: "none",
                    color: "#8c827a",
                    cursor: "pointer",
                    padding: 2,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Icon name="x" size={12} />
                </button>
              )}

              {/* Table Search Suggestions Popover */}
              {searchSuggestionsOpen && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "calc(100% + 6px)",
                    width: 320,
                    maxWidth: "92vw",
                    background: "#ffffff",
                    border: "1px solid #ede8e3",
                    borderRadius: 14,
                    boxShadow: "0 16px 36px rgba(0, 0, 0, 0.14)",
                    zIndex: 50,
                    overflow: "hidden",
                    animation: "fadeIn 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 14px",
                      background: "#faf7f4",
                      borderBottom: "1px solid #f0eae4",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ textTransform: "uppercase", letterSpacing: "0.04em", color: "#786e68" }}>
                      Quick Suggestions
                    </span>
                    <span style={{ fontSize: "0.68rem", color: "#a89f97", fontWeight: 500 }}>Click to filter</span>
                  </div>

                  <div style={{ padding: "6px 0", maxHeight: 340, overflowY: "auto" }}>
                    {(() => {
                      if (locks.length === 0) {
                        return (
                          <div style={{ padding: "1.75rem 1rem", textAlign: "center", color: "#8c827a", fontSize: "0.82rem" }}>
                            <div style={{ fontSize: "1.6rem", marginBottom: 6 }}>🔒</div>
                            <div style={{ fontWeight: 700, color: "#1a1615", fontSize: "0.9rem" }}>
                              No training locks in database
                            </div>
                            <div style={{ fontSize: "0.74rem", color: "#a89f97", marginTop: 4, lineHeight: 1.45 }}>
                              Training locks are placed on injured horses requiring clinical rest.
                            </div>
                          </div>
                        );
                      }

                      const q = search.trim().toLowerCase();

                      // Dynamic unique lock codes
                      const matchingCodes = Array.from(new Set(locks.map((l) => l.lockCode).filter(Boolean))).filter(
                        (c) => !q || (c && c.toLowerCase().includes(q))
                      );

                      // Dynamic unique horses under lock
                      const matchingHorses = Array.from(new Set(locks.map((l) => l.horseName || l.horseId).filter(Boolean))).filter(
                        (h) => !q || (h && h.toLowerCase().includes(q))
                      );

                      // Dynamic unique clinical reasons from real locks
                      const matchingReasons = Array.from(new Set(locks.map((l) => l.lockReason).filter(Boolean))).filter(
                        (r) => !q || (r && r.toLowerCase().includes(q))
                      );

                      const total = matchingCodes.length + matchingHorses.length + matchingReasons.length;

                      if (total === 0) {
                        return (
                          <div style={{ padding: "1.75rem 1rem", textAlign: "center", color: "#8c827a", fontSize: "0.82rem" }}>
                            <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>🔍</div>
                            <div style={{ fontWeight: 700, color: "#1a1615", fontSize: "0.9rem" }}>
                              No locks match &quot;<strong>{search}</strong>&quot;
                            </div>
                            <div style={{ fontSize: "0.74rem", color: "#a89f97", marginTop: 4 }}>
                              Try searching by letter, lock code, horse name, or reason
                            </div>
                          </div>
                        );
                      }

                      return (
                        <>
                          {/* Active Lock Codes */}
                          {matchingCodes.length > 0 && (
                            <div>
                              <div style={{ padding: "4px 14px 2px", fontSize: "0.68rem", fontWeight: 700, color: "#8c827a", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                Lock Codes ({matchingCodes.length})
                              </div>
                              {matchingCodes.map((code) => (
                                <div
                                  key={code}
                                  onClick={() => {
                                    setSearch(code);
                                    setSearchSuggestionsOpen(false);
                                  }}
                                  style={{
                                    padding: "7px 14px",
                                    cursor: "pointer",
                                    fontSize: "0.79rem",
                                    color: "#1a1615",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 9,
                                    transition: "background 0.12s ease",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fbf5ee")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                  <span style={{ color: "#731b24", fontSize: "0.9rem" }}>🔒</span>
                                  <span style={{ fontWeight: 700 }}>{code}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Horses */}
                          {matchingHorses.length > 0 && (
                            <div>
                              <div style={{ padding: "8px 14px 2px", fontSize: "0.68rem", fontWeight: 700, color: "#8c827a", textTransform: "uppercase", letterSpacing: "0.03em", borderTop: matchingCodes.length > 0 ? "1px solid #f6f2ef" : "none", marginTop: 4 }}>
                                Horses Under Lock ({matchingHorses.length})
                              </div>
                              {matchingHorses.map((horse) => (
                                <div
                                  key={horse}
                                  onClick={() => {
                                    setSearch(horse);
                                    setSearchSuggestionsOpen(false);
                                  }}
                                  style={{
                                    padding: "7px 14px",
                                    cursor: "pointer",
                                    fontSize: "0.79rem",
                                    color: "#1a1615",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 9,
                                    transition: "background 0.12s ease",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fbf5ee")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                  <span style={{ color: "#731b24", fontSize: "0.9rem" }}>🐴</span>
                                  <span style={{ fontWeight: 600 }}>{horse}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reasons */}
                          {matchingReasons.length > 0 && (
                            <div>
                              <div style={{ padding: "8px 14px 2px", fontSize: "0.68rem", fontWeight: 700, color: "#8c827a", textTransform: "uppercase", letterSpacing: "0.03em", borderTop: "1px solid #f6f2ef", marginTop: 4 }}>
                                Clinical Reasons ({matchingReasons.length})
                              </div>
                              {matchingReasons.map((reason) => (
                                <div
                                  key={reason}
                                  onClick={() => {
                                    setSearch(reason);
                                    setSearchSuggestionsOpen(false);
                                  }}
                                  style={{
                                    padding: "7px 14px",
                                    cursor: "pointer",
                                    fontSize: "0.79rem",
                                    color: "#1a1615",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 9,
                                    transition: "background 0.12s ease",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fbf5ee")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#731b24", flexShrink: 0 }} />
                                  <span>{reason}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Filter Dropdown Button */}
            <div style={{ position: "relative" }} ref={filterRef}>
              <button
                type="button"
                onClick={() => setFilterOpen((prev) => !prev)}
                style={{
                  height: 36,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  background: "#ffffff",
                  border: "1px solid #e2ddd7",
                  borderRadius: 9,
                  padding: "0 13px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#2b201a",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#faf7f4")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
              >
                <Icon name="filter" size={14} />
                <span>Filter{activeTab !== "ALL" ? `: ${activeTab === "ACTIVE" ? "Active" : "Released"}` : ""}</span>
                <Icon name="chevronDown" size={12} />
              </button>

              {filterOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 6px)",
                    background: "#ffffff",
                    border: "1px solid #ede8e3",
                    borderRadius: 10,
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
                    zIndex: 30,
                    minWidth: 175,
                    padding: "4px 0",
                    animation: "fadeIn 0.15s ease",
                  }}
                >
                  {[
                    { id: "ALL", label: `All Locks (${locks.length})` },
                    { id: "ACTIVE", label: `Active (${locks.filter((l) => l.status === "ACTIVE").length})` },
                    { id: "RELEASED", label: `Released (${locks.filter((l) => l.status === "RELEASED").length})` },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setFilterOpen(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 14px",
                        border: "none",
                        background: activeTab === item.id ? "#fbf2eb" : "transparent",
                        color: activeTab === item.id ? "#7a1e27" : "#333",
                        fontWeight: activeTab === item.id ? 700 : 500,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== item.id) e.currentTarget.style.background = "#f8f5f2";
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== item.id) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span>{item.label}</span>
                      {activeTab === item.id && <Icon name="check" size={13} style={{ color: "#7a1e27" }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading training locks...</div>
        ) : filteredLocks.length === 0 ? (
          <EmptyState
            title="No training locks found"
            description="No training lock records match the current filter criteria."
          />
        ) : (
          <div style={{ width: "100%", padding: "0.6rem 0.85rem 0.85rem", boxSizing: "border-box" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ background: "#fbf5ee", borderRadius: 12 }}>
                  {/* 1. Lock Code */}
                  <th
                    style={{
                      padding: "0.65rem 0.45rem 0.65rem 0.85rem",
                      borderTopLeftRadius: 12,
                      borderBottomLeftRadius: 12,
                      whiteSpace: "nowrap",
                      width: "14%",
                    }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#3d1d12", fontWeight: 700, fontSize: "0.81rem", whiteSpace: "nowrap" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b3419" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                        <path d="M7 7v10M11 7v10M15 7v10M17 7v10" />
                      </svg>
                      Lock Code
                    </div>
                  </th>

                  {/* 2. Horse */}
                  <th style={{ padding: "0.65rem 0.45rem", whiteSpace: "nowrap", width: "11%" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#3d1d12", fontWeight: 700, fontSize: "0.81rem", whiteSpace: "nowrap" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b3419" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M7.6 21c0-3.6 1.3-5.9 3.5-7.6l-2.7.9c-1.6.5-3-1-2.4-2.6l1.8-4.3C8.9 4.7 10.9 3.3 13.1 3V1.6l3.2 2.2c2.4 1.7 3.7 4.4 3.7 7.4 0 3.8-1.2 6.7-2.1 9.8" />
                        <path d="M6 21h12.5" />
                        <circle cx="12.4" cy="8.6" r=".6" fill="#6b3419" stroke="none" />
                      </svg>
                      Horse
                    </div>
                  </th>

                  {/* 3. Applied Status (Guaranteed on 1 line) */}
                  <th style={{ padding: "0.65rem 0.45rem", whiteSpace: "nowrap", width: "11%" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#3d1d12", fontWeight: 700, fontSize: "0.81rem", whiteSpace: "nowrap" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b3419" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="8" y2="9" />
                      </svg>
                      Applied Status
                    </div>
                  </th>

                  {/* 4. Medical Reason */}
                  <th style={{ padding: "0.65rem 0.45rem", whiteSpace: "nowrap", width: "21%" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#3d1d12", fontWeight: 700, fontSize: "0.81rem", whiteSpace: "nowrap" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b3419" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3M4.5 3h2M13.5 3h-2M9 12.5v3.5a3 3 0 0 0 6 0V14" />
                        <circle cx="18" cy="14" r="2.5" />
                      </svg>
                      Medical Reason
                    </div>
                  </th>

                  {/* 5. Locked Date */}
                  <th style={{ padding: "0.65rem 0.45rem", whiteSpace: "nowrap", width: "10%" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#3d1d12", fontWeight: 700, fontSize: "0.81rem", whiteSpace: "nowrap" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b3419" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Locked Date
                    </div>
                  </th>

                  {/* 6. Review Date */}
                  <th style={{ padding: "0.65rem 0.45rem", whiteSpace: "nowrap", width: "10%" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#3d1d12", fontWeight: 700, fontSize: "0.81rem", whiteSpace: "nowrap" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b3419" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <polyline points="9 16 11 18 15 14" />
                      </svg>
                      Review Date
                    </div>
                  </th>

                  {/* 7. Status */}
                  <th style={{ padding: "0.65rem 0.45rem", whiteSpace: "nowrap", width: "9%" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#3d1d12", fontWeight: 700, fontSize: "0.81rem", whiteSpace: "nowrap" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b3419" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                      Status
                    </div>
                  </th>

                  {/* 8. Actions (LEFT-ALIGNED WITH SOLID COGWHEEL MATCHING REFERENCE IMAGE 3) */}
                  {isVet && (
                    <th
                      style={{
                        padding: "0.65rem 0.85rem 0.65rem 0.45rem",
                        textAlign: "left",
                        borderTopRightRadius: 12,
                        borderBottomRightRadius: 12,
                        whiteSpace: "nowrap",
                        width: "14%",
                      }}
                    >
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", color: "#3d1d12", fontWeight: 700, fontSize: "0.81rem", whiteSpace: "nowrap" }}>
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="#422013" style={{ flexShrink: 0 }}>
                          <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
                        </svg>
                        Actions
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredLocks.map((lock) => (
                  <tr
                    key={lock.id}
                    onClick={() => navigate(`/medical/horses/${lock.horseId}`)}
                    style={{
                      borderBottom: "1px solid #f2ede8",
                      transition: "background 0.12s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#faf7f4")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* 1. Lock Code (Clean text, removed copy icon button) */}
                    <td style={{ padding: "0.75rem 0.45rem 0.75rem 0.85rem", verticalAlign: "middle", position: "relative", whiteSpace: "nowrap" }}>
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "20%",
                          bottom: "20%",
                          width: 4,
                          background: lock.status === "ACTIVE" ? "#7c1a22" : "#9ca3af",
                          borderRadius: "0 3px 3px 0",
                        }}
                      />
                      <span style={{ fontWeight: 700, fontSize: "0.83rem", color: "#1a1615" }}>
                        {lock.lockCode}
                      </span>
                    </td>

                    {/* 2. Horse */}
                    <td style={{ padding: "0.75rem 0.45rem", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "0.84rem",
                          color: "#7c1a22",
                          display: "block",
                          lineHeight: 1.25,
                        }}
                      >
                        {lock.horseName || lock.horseId}
                      </span>
                      <div style={{ fontSize: "0.74rem", color: "#7a726d", marginTop: 2, fontWeight: 500 }}>
                        ({lock.horseCode || lock.horseId})
                      </div>
                    </td>

                    {/* 3. Applied Status */}
                    <td style={{ padding: "0.75rem 0.45rem", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "#fcf1ef",
                          border: "1px solid #f6d4ce",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "#a82b2b",
                          letterSpacing: "0.02em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a82b2b" }} />
                        {lock.appliedMedicalStatus}
                      </span>
                    </td>

                    {/* 4. Medical Reason */}
                    <td style={{ padding: "0.75rem 0.45rem", maxWidth: 195, verticalAlign: "middle" }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.81rem",
                          color: "#1a1615",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          lineHeight: 1.3,
                        }}
                        title={lock.lockReason}
                      >
                        {lock.lockReason}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: "0.72rem",
                          color: "#666",
                          marginTop: 2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={`Vet: ${lock.lockedBy}`}
                      >
                        <Icon name="stethoscope" size={11} style={{ color: "#7c1a22", flexShrink: 0 }} />
                        <span>Vet: {lock.lockedBy}</span>
                      </div>
                    </td>

                    {/* 5. Locked Date */}
                    <td style={{ padding: "0.75rem 0.45rem", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "3px 7px",
                          borderRadius: 6,
                          background: "#f3f6f9",
                          border: "1px solid #e2e8f0",
                          color: "#344054",
                          fontSize: "0.74rem",
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Icon name="calendar" size={11} style={{ color: "#475467" }} />
                        {lock.lockedAt}
                      </div>
                    </td>

                    {/* 6. Review Date */}
                    <td style={{ padding: "0.75rem 0.45rem", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "3px 7px",
                          borderRadius: 6,
                          background: "#fef8ee",
                          border: "1px solid #f6deb8",
                          color: "#8c4412",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Icon name="calendar" size={11} style={{ color: "#b54708" }} />
                        {lock.reviewDate}
                      </div>
                    </td>

                    {/* 7. Status */}
                    <td style={{ padding: "0.75rem 0.45rem", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      {lock.status === "ACTIVE" ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "#ecf7ed",
                            border: "1px solid #c9ebd0",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "#166534",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#166534" }} />
                          Active Lock
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "#f4f4f5",
                            border: "1px solid #e4e4e7",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "#52525b",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#71717a" }} />
                          Released
                        </span>
                      )}
                    </td>

                    {/* 8. Actions (LEFT-ALIGNED WITH SAMPLED BUTTONS MATCHING REFERENCE IMAGE 3) */}
                    {isVet && (
                      <td
                        onClick={(e) => e.stopPropagation()}
                        style={{ padding: "0.75rem 0.85rem 0.75rem 0.45rem", textAlign: "left", verticalAlign: "middle", whiteSpace: "nowrap", cursor: "default" }}
                      >
                        {lock.status === "ACTIVE" ? (
                          <div style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center", justifyContent: "flex-start", whiteSpace: "nowrap" }}>
                            {/* Extend Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLock(lock);
                                setModalMode("extend");
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.28rem",
                                background: "#ffffff",
                                border: "1px solid #d0d5dd",
                                borderRadius: 7,
                                padding: "0.28rem 0.58rem",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "#344054",
                                cursor: "pointer",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                transition: "all 0.15s ease",
                                whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#f9fafb";
                                e.currentTarget.style.borderColor = "#98a2b3";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#ffffff";
                                e.currentTarget.style.borderColor = "#d0d5dd";
                              }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                              Extend
                            </button>

                            {/* Lift Lock Button (Solid white lock with keyhole cutout matching reference Image 3) */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLock(lock);
                                setModalMode("lift");
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.32rem",
                                background: "#731b24",
                                border: "1px solid #731b24",
                                borderRadius: 7,
                                padding: "0.28rem 0.68rem",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "#ffffff",
                                cursor: "pointer",
                                boxShadow: "0 1px 3px rgba(115, 27, 36, 0.25)",
                                transition: "all 0.15s ease",
                                whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#5e151d";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#731b24";
                              }}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="#ffffff" style={{ flexShrink: 0 }}>
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm3 8V7a3 3 0 0 0-6 0v3h6zm-3 4a1.5 1.5 0 0 0-1 1.41V17a1 1 0 0 0 2 0v-1.59A1.5 1.5 0 0 0 12 14z"
                                />
                              </svg>
                              Lift Lock
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            Released {lock.releasedAt} ({lock.releaseReason || "Recovered"})
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lock Modals */}
      {modalMode && (
        <TrainingLockModal
          horseName={
            selectedLock
              ? selectedLock.horseName
                ? `${selectedLock.horseName} (${selectedLock.horseCode || selectedLock.horseId})`
                : selectedLock.horseId
              : horses[0]
              ? `${horses[0].name} (${horses[0].code})`
              : "Horse"
          }
          horseId={selectedLock?.horseId || (horses[0]?.id ?? "")}
          horseOptions={horses.map((h) => ({
            value: h.id,
            label: `${h.name} (${h.code}) - ${h.healthGroup}${h.isLocked ? " [LOCKED]" : ""}`,
          }))}
          currentReviewDate={selectedLock?.reviewDate}
          mode={modalMode}
          onClose={() => {
            setModalMode(null);
            setSelectedLock(null);
          }}
          onPlaceLock={async (dto) => {
            const targetHorseId = dto.horseId || selectedLock?.horseId || (horses[0]?.id ?? "");
            if (!targetHorseId) {
              toast.show("Please create at least one horse in Herd Health first.", "danger");
              return;
            }
            await healthApi.applyTrainingLock(targetHorseId, {
              appliedMedicalStatus: dto.appliedStatus,
              lockReason: dto.reason,
              reviewDate: dto.reviewDate,
              unlockConditions: dto.unlockConditions,
            });
            toast.show("Training lock placed successfully", "ok");
            setModalMode(null);
            setSelectedLock(null);
            void loadLocks();
          }}
          onLiftLock={async (dto) => {
            if (!selectedLock) return;
            await healthApi.releaseTrainingLock(selectedLock.id, {
              targetStatus: dto.restoreStatus,
              releaseReason: dto.reason,
              horseId: selectedLock.horseId,
            });
            toast.show(
              `Training lock lifted successfully. Horse restored to ${dto.restoreStatus === "FIT" ? "Fit for Training" : "Under Observation"}`,
              "ok",
            );
            setModalMode(null);
            setSelectedLock(null);
            void loadLocks();
          }}
          onExtendLock={async (dto) => {
            if (!selectedLock) return;
            await healthApi.extendTrainingLock(selectedLock.id, {
              newReviewDate: dto.newReviewDate,
              reason: dto.reason,
              horseId: selectedLock.horseId,
            });
            toast.show(`Training lock review date extended to ${dto.newReviewDate}`, "ok");
            setModalMode(null);
            setSelectedLock(null);
            void loadLocks();
          }}
        />
      )}
    </div>
  );
}
