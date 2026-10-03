import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Field } from "@/shared/components/form/Field";
import { Icon } from "@/shared/components/ui/Icon";
import { Input } from "@/shared/components/form/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { Textarea } from "@/shared/components/form/Textarea";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { healthApi } from "../api";
import type { PreventiveCareItem, PreventiveStatus } from "../types";

const CATEGORY_LABELS: Record<string, string> = {
  ALL: "All Categories",
  VACCINATION: "Vaccination",
  DEWORMING: "Deworming",
  FARRIER: "Farrier Care",
  DENTAL: "Dental Care",
  GENERAL: "Routine Checkup",
};

const CATEGORY_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  VACCINATION: { bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af" },
  DEWORMING: { bg: "#f0fdf4", border: "#bbf7d0", color: "#166534" },
  FARRIER: { bg: "#fefce8", border: "#fef08a", color: "#854d0e" },
  DENTAL: { bg: "#faf5ff", border: "#e9d5ff", color: "#6b21a8" },
  GENERAL: { bg: "#f3f4f6", border: "#e5e7eb", color: "#374151" },
};

const STATUS_BADGES: Record<
  PreventiveStatus,
  { label: string; bg: string; border: string; color: string; indicator: string }
> = {
  UP_TO_DATE: {
    label: "Up to Date",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    color: "#065f46",
    indicator: "#16a34a",
  },
  DUE_SOON: {
    label: "Due Soon",
    bg: "#fef3c7",
    border: "#fde68a",
    color: "#92400e",
    indicator: "#d97706",
  },
  OVERDUE: {
    label: "Overdue",
    bg: "#fee2e2",
    border: "#fca5a5",
    color: "#991b1b",
    indicator: "#dc2626",
  },
  NO_DATA: {
    label: "No Data",
    bg: "#f3f4f6",
    border: "#e5e7eb",
    color: "#4b5563",
    indicator: "#9ca3af",
  },
};

export default function CareSchedulePage() {
  const { user } = useAuth();
  const toast = useToast();
  const isVet = user?.role === "VETERINARIAN" || user?.role === "CLUB_MANAGER";

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [items, setItems] = useState<PreventiveCareItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const [searchSuggestionsOpen, setSearchSuggestionsOpen] = useState(false);
  const statusFilterRef = useRef<HTMLDivElement>(null);
  const categoryFilterRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Record Completion Modal (DL-3.12)
  const [selectedCare, setSelectedCare] = useState<PreventiveCareItem | null>(null);
  const [adminDate, setAdminDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [adminBy, setAdminBy] = useState<string>(user?.fullName || "");
  const [nextDue, setNextDue] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Close filter dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusFilterRef.current && !statusFilterRef.current.contains(e.target as Node)) {
        setStatusFilterOpen(false);
      }
      if (categoryFilterRef.current && !categoryFilterRef.current.contains(e.target as Node)) {
        setCategoryFilterOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await healthApi.getCareSchedules();
      setItems(data);
    } catch {
      toast.show("Unable to load preventive care schedules", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const handleSync = () => {
      void loadData();
    };
    window.addEventListener("horsesUpdated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("horsesUpdated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [loadData]);

  const handleOpenCompleteModal = (care: PreventiveCareItem) => {
    setSelectedCare(care);
    setAdminDate(new Date().toISOString().split("T")[0]);
    setAdminBy(user?.fullName || "Lead Veterinarian");
    const nextDate = new Date();
    if (care.category === "VACCINATION") nextDate.setMonth(nextDate.getMonth() + 6);
    else if (care.category === "DEWORMING") nextDate.setMonth(nextDate.getMonth() + 3);
    else if (care.category === "FARRIER") nextDate.setDate(nextDate.getDate() + 35);
    else nextDate.setFullYear(nextDate.getFullYear() + 1);
    setNextDue(nextDate.toISOString().split("T")[0]);
    setNotes("");
  };

  const handleSubmitComplete = async () => {
    if (!selectedCare) return;
    try {
      setSubmitting(true);
      await healthApi.recordCareCompletion(selectedCare.id, {
        administeredDate: adminDate,
        administeredBy: adminBy,
        nextDueDate: nextDue,
        notes,
      });
      toast.show(`Recorded completion: ${selectedCare.type}`, "ok");
      setSelectedCare(null);
      void loadData();
    } catch {
      toast.show("Error recording care completion", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesTab =
      activeTab === "ALL"
        ? true
        : activeTab === "OVERDUE"
        ? item.status === "OVERDUE"
        : activeTab === "DUE_SOON"
        ? item.status === "DUE_SOON"
        : item.status === "UP_TO_DATE";

    const matchesCategory = selectedCategory === "ALL" ? true : item.category === selectedCategory;

    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.horseId.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q));

    return matchesTab && matchesCategory && matchesSearch;
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: 700 }}>
            Preventive Care Schedule & Catalog
          </h1>
        </div>
      </div>

      {/* Main Card Container matching Training Locks aesthetic */}
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
          {/* Left: Syringe/Shield Badge & Title */}
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19.5 4.5l-2-2a1.5 1.5 0 0 0-2.12 0l-1.5 1.5 4.12 4.12 1.5-1.5a1.5 1.5 0 0 0 0-2.12z"
                  fill="#422013"
                />
                <path
                  d="M13.5 4.5L5 13l-1.5 4.5L8 16l8.5-8.5-3-3z"
                  fill="#422013"
                />
                <circle cx="10" cy="11" r="1.2" fill="#fbf1e8" />
                <path d="M4 20l3-3" stroke="#422013" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: "#1a1615",
                  letterSpacing: "-0.01em",
                }}
              >
                Preventive Care Management
              </h2>
            </div>
          </div>

          {/* Right: Search & Filter Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
            {/* Search Input with In-Table Suggestions Popover */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }} ref={searchContainerRef}>
              <span
                style={{
                  position: "absolute",
                  left: 11,
                  color: "#8c827a",
                  display: "flex",
                  pointerEvents: "none",
                }}
              >
                <Icon name="search" size={14} />
              </span>
              <input
                type="text"
                placeholder="Search service, horse ID..."
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
                  width: 230,
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
                      if (items.length === 0) {
                        return (
                          <div style={{ padding: "1.75rem 1rem", textAlign: "center", color: "#8c827a", fontSize: "0.82rem" }}>
                            <div style={{ fontSize: "1.6rem", marginBottom: 6 }}>💉</div>
                            <div style={{ fontWeight: 700, color: "#1a1615", fontSize: "0.9rem" }}>
                              No care records in database
                            </div>
                            <div style={{ fontSize: "0.74rem", color: "#a89f97", marginTop: 4, lineHeight: 1.45 }}>
                              Care schedules are automatically generated from registered horses.
                            </div>
                          </div>
                        );
                      }

                      const q = search.trim().toLowerCase();

                      // Dynamic unique services from real items
                      const matchingServices = Array.from(new Set(items.map((i) => i.type).filter(Boolean))).filter(
                        (srv) => !q || srv.toLowerCase().includes(q)
                      );

                      // Dynamic unique horses from real items
                      const matchingHorses = Array.from(new Set(items.map((i) => i.horseId).filter(Boolean))).filter(
                        (h) => !q || h.toLowerCase().includes(q)
                      );

                      const total = matchingServices.length + matchingHorses.length;

                      if (total === 0) {
                        return (
                          <div style={{ padding: "1.75rem 1rem", textAlign: "center", color: "#8c827a", fontSize: "0.82rem" }}>
                            <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>🔍</div>
                            <div style={{ fontWeight: 700, color: "#1a1615", fontSize: "0.9rem" }}>
                              No records match &quot;<strong>{search}</strong>&quot;
                            </div>
                            <div style={{ fontSize: "0.74rem", color: "#a89f97", marginTop: 4 }}>
                              Try searching by letter, service name, or horse name/code
                            </div>
                          </div>
                        );
                      }

                      return (
                        <>
                          {/* Services */}
                          {matchingServices.length > 0 && (
                            <div>
                              <div style={{ padding: "4px 14px 2px", fontSize: "0.68rem", fontWeight: 700, color: "#8c827a", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                Services & Protocols ({matchingServices.length})
                              </div>
                              {matchingServices.map((serviceName) => (
                                <div
                                  key={serviceName}
                                  onClick={() => {
                                    setSearch(serviceName);
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
                                  <span style={{ color: "#731b24", fontSize: "0.9rem" }}>💉</span>
                                  <span>{serviceName}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Horses */}
                          {matchingHorses.length > 0 && (
                            <div>
                              <div style={{ padding: "8px 14px 2px", fontSize: "0.68rem", fontWeight: 700, color: "#8c827a", textTransform: "uppercase", letterSpacing: "0.03em", borderTop: matchingServices.length > 0 ? "1px solid #f6f2ef" : "none", marginTop: 4 }}>
                                Horses in Schedule ({matchingHorses.length})
                              </div>
                              {matchingHorses.map((horseStr) => (
                                <div
                                  key={horseStr}
                                  onClick={() => {
                                    setSearch(horseStr);
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
                                  <span style={{ fontWeight: 600 }}>{horseStr}</span>
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

            {/* Category Filter Dropdown */}
            <div style={{ position: "relative" }} ref={categoryFilterRef}>
              <button
                type="button"
                onClick={() => setCategoryFilterOpen((prev) => !prev)}
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
                <Icon name="tag" size={14} />
                <span>
                  {selectedCategory === "ALL"
                    ? "All Categories"
                    : CATEGORY_LABELS[selectedCategory] || selectedCategory}
                </span>
                <Icon name="chevronDown" size={12} />
              </button>

              {categoryFilterOpen && (
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
                    minWidth: 180,
                    padding: "4px 0",
                    animation: "fadeIn 0.15s ease",
                  }}
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(k);
                        setCategoryFilterOpen(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 14px",
                        border: "none",
                        background: selectedCategory === k ? "#fbf2eb" : "transparent",
                        color: selectedCategory === k ? "#7a1e27" : "#333",
                        fontWeight: selectedCategory === k ? 700 : 500,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCategory !== k) e.currentTarget.style.background = "#f8f5f2";
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCategory !== k) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span>{v}</span>
                      {selectedCategory === k && (
                        <Icon name="check" size={13} style={{ color: "#7a1e27" }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <div style={{ position: "relative" }} ref={statusFilterRef}>
              <button
                type="button"
                onClick={() => setStatusFilterOpen((prev) => !prev)}
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
                <span>
                  Filter:{" "}
                  {activeTab === "ALL"
                    ? "All"
                    : activeTab === "DUE_SOON"
                    ? "Due Soon"
                    : activeTab === "OVERDUE"
                    ? "Overdue"
                    : "Up to Date"}
                </span>
                <Icon name="chevronDown" size={12} />
              </button>

              {statusFilterOpen && (
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
                    { id: "ALL", label: `All (${items.length})` },
                    {
                      id: "OVERDUE",
                      label: `Overdue (${items.filter((i) => i.status === "OVERDUE").length})`,
                    },
                    {
                      id: "DUE_SOON",
                      label: `Due Soon (${items.filter((i) => i.status === "DUE_SOON").length})`,
                    },
                    {
                      id: "UP_TO_DATE",
                      label: `Up to Date (${items.filter((i) => i.status === "UP_TO_DATE").length})`,
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setStatusFilterOpen(false);
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
                      {activeTab === item.id && (
                        <Icon name="check" size={13} style={{ color: "#7a1e27" }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Loading care schedules...
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="No care schedules found"
            description="No care records match the current filter criteria."
          />
        ) : (
          <div
            style={{
              width: "100%",
              padding: "0.6rem 0.85rem 0.85rem",
              boxSizing: "border-box",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.8rem",
              }}
            >
              <thead>
                <tr style={{ background: "#fbf5ee", borderRadius: 12 }}>
                  {/* 1. Care Service */}
                  <th
                    style={{
                      padding: "0.65rem 0.45rem 0.65rem 0.85rem",
                      borderTopLeftRadius: 12,
                      borderBottomLeftRadius: 12,
                      whiteSpace: "nowrap",
                      width: "20%",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        color: "#3d1d12",
                        fontWeight: 700,
                        fontSize: "0.81rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6b3419"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                      Care Service
                    </div>
                  </th>

                  {/* 2. Horse */}
                  <th style={{ padding: "0.65rem 0.45rem", whiteSpace: "nowrap", width: "16%" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        color: "#3d1d12",
                        fontWeight: 700,
                        fontSize: "0.81rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6b3419"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <path d="M7.6 21c0-3.6 1.3-5.9 3.5-7.6l-2.7.9c-1.6.5-3-1-2.4-2.6l1.8-4.3C8.9 4.7 10.9 3.3 13.1 3V1.6l3.2 2.2c2.4 1.7 3.7 4.4 3.7 7.4 0 3.8-1.2 6.7-2.1 9.8" />
                        <path d="M6 21h12.5" />
                        <circle cx="12.4" cy="8.6" r=".6" fill="#6b3419" stroke="none" />
                      </svg>
                      Horse
                    </div>
                  </th>

                  {/* 3. Category */}
                  <th style={{ padding: "0.65rem 0.45rem", whiteSpace: "nowrap", width: "12%" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        color: "#3d1d12",
                        fontWeight: 700,
                        fontSize: "0.81rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6b3419"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      Category
                    </div>
                  </th>

                  {/* 4. Last Administered */}
                  <th style={{ padding: "0.65rem 0.45rem", whiteSpace: "nowrap", width: "16%" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        color: "#3d1d12",
                        fontWeight: 700,
                        fontSize: "0.81rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6b3419"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Last Administered
                    </div>
                  </th>

                  {/* 5. Due Date */}
                  <th style={{ padding: "0.65rem 0.45rem", whiteSpace: "nowrap", width: "10%" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        color: "#3d1d12",
                        fontWeight: 700,
                        fontSize: "0.81rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6b3419"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Due Date
                    </div>
                  </th>

                  {/* 6. Status */}
                  <th style={{ padding: "0.65rem 0.45rem", whiteSpace: "nowrap", width: "10%" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        color: "#3d1d12",
                        fontWeight: 700,
                        fontSize: "0.81rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6b3419"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                      Status
                    </div>
                  </th>

                  {/* 7. Notes */}
                  <th style={{ padding: "0.65rem 0.45rem", minWidth: 160, whiteSpace: "normal" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        color: "#3d1d12",
                        fontWeight: 700,
                        fontSize: "0.81rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6b3419"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      Notes
                    </div>
                  </th>

                  {/* 8. Actions */}
                  {isVet && (
                    <th
                      style={{
                        padding: "0.65rem 0.85rem 0.65rem 0.45rem",
                        textAlign: "left",
                        borderTopRightRadius: 12,
                        borderBottomRightRadius: 12,
                        whiteSpace: "nowrap",
                        width: "12%",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.45rem",
                          color: "#3d1d12",
                          fontWeight: 700,
                          fontSize: "0.81rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 16 16"
                          fill="#422013"
                          style={{ flexShrink: 0 }}
                        >
                          <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
                        </svg>
                        Actions
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const statusConf = STATUS_BADGES[item.status] || STATUS_BADGES.NO_DATA;
                  const categoryStyle =
                    CATEGORY_STYLES[item.category] || CATEGORY_STYLES.GENERAL;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid #f2ede8",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#faf7f4")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* 1. Care Service */}
                      <td
                        style={{
                          padding: "0.75rem 0.45rem 0.75rem 0.85rem",
                          verticalAlign: "middle",
                          position: "relative",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {/* Status color left stripe */}
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "20%",
                            bottom: "20%",
                            width: 4,
                            background: statusConf.indicator,
                            borderRadius: "0 3px 3px 0",
                          }}
                        />
                        <span style={{ fontWeight: 700, fontSize: "0.83rem", color: "#1a1615" }}>
                          {item.type}
                        </span>
                      </td>

                      {/* 2. Horse */}
                      <td style={{ padding: "0.75rem 0.45rem", verticalAlign: "middle" }}>
                        <Link
                          to={`/medical/records`}
                          style={{
                            fontWeight: 600,
                            fontSize: "0.82rem",
                            color: "#731b24",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                        >
                          {item.horseId}
                        </Link>
                      </td>

                      {/* 3. Category */}
                      <td style={{ padding: "0.75rem 0.45rem", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 9px",
                            borderRadius: 20,
                            background: categoryStyle.bg,
                            border: `1px solid ${categoryStyle.border}`,
                            color: categoryStyle.color,
                            fontSize: "0.74rem",
                            fontWeight: 600,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: categoryStyle.color,
                            }}
                          />
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                      </td>

                      {/* 4. Last Administered */}
                      <td style={{ padding: "0.75rem 0.45rem", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <div
                          style={{
                            fontVariantNumeric: "tabular-nums",
                            color: "#1a1615",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          {item.lastAdministeredDate || "Not recorded"}
                        </div>
                        {item.administeredBy && (
                          <div style={{ fontSize: "0.72rem", color: "#786e68", marginTop: 2 }}>
                            By: {item.administeredBy}
                          </div>
                        )}
                      </td>

                      {/* 5. Due Date */}
                      <td style={{ padding: "0.75rem 0.45rem", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontVariantNumeric: "tabular-nums",
                            fontSize: "0.8rem",
                            fontWeight: item.status === "OVERDUE" ? 700 : 500,
                            color: item.status === "OVERDUE" ? "#991b1b" : "#2b201a",
                          }}
                        >
                          {item.dueDate}
                        </span>
                      </td>

                      {/* 6. Status */}
                      <td style={{ padding: "0.75rem 0.45rem", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 9px",
                            borderRadius: 20,
                            background: statusConf.bg,
                            border: `1px solid ${statusConf.border}`,
                            color: statusConf.color,
                            fontSize: "0.74rem",
                            fontWeight: 600,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: statusConf.indicator,
                            }}
                          />
                          {statusConf.label}
                        </span>
                      </td>

                      {/* 7. Notes */}
                      <td
                        style={{
                          padding: "0.75rem 0.45rem",
                          verticalAlign: "middle",
                          maxWidth: 240,
                          color: "#6b7280",
                          fontSize: "0.78rem",
                          lineHeight: 1.35,
                          whiteSpace: "normal",
                        }}
                      >
                        {item.notes || "—"}
                      </td>

                      {/* 8. Actions */}
                      {isVet && (
                        <td
                          style={{
                            padding: "0.75rem 0.85rem 0.75rem 0.45rem",
                            verticalAlign: "middle",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenCompleteModal(item)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              background: "#1e5a32",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: 8,
                              padding: "5px 11px",
                              fontSize: "0.77rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              boxShadow: "0 1px 3px rgba(30, 90, 50, 0.2)",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#144224";
                              e.currentTarget.style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#1e5a32";
                              e.currentTarget.style.transform = "translateY(0)";
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Record Completion</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Completion Modal (DL-3.12) */}
      {selectedCare && (
        <Modal
          onClose={() => setSelectedCare(null)}
          title={`Record Completion: ${selectedCare.type}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                padding: "0.75rem 1rem",
                background: "#fbf6f2",
                border: "1px solid #eedece",
                borderRadius: 8,
                fontSize: "0.85rem",
              }}
            >
              <div>
                <strong>Horse:</strong> {selectedCare.horseId}
              </div>
              <div style={{ marginTop: 3 }}>
                <strong>Service:</strong> {selectedCare.type} (
                {CATEGORY_LABELS[selectedCare.category] || selectedCare.category})
              </div>
            </div>

            <Field label="Administered Date" required>
              <Input
                type="date"
                value={adminDate}
                onChange={(e) => setAdminDate(e.target.value)}
              />
            </Field>

            <Field label="Administered By / Vet Clinic" required>
              <Input
                value={adminBy}
                onChange={(e) => setAdminBy(e.target.value)}
                placeholder="e.g., Head Veterinarian Dr. Sarah Connor"
              />
            </Field>

            <Field
              label="Next Due Date"
              required
              hint="Auto-calculated from protocol interval; can be manually adjusted"
            >
              <Input
                type="date"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
              />
            </Field>

            <Field label="Notes & Post-Care Observations">
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Deep IM injection, no febrile reaction, normal appetite and gait..."
              />
            </Field>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "0.5rem",
              }}
            >
              <Button tone="ghost" onClick={() => setSelectedCare(null)}>
                Cancel
              </Button>
              <Button
                tone="primary"
                onClick={() => void handleSubmitComplete()}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Confirm Completion"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
