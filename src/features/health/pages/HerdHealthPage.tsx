import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/form/Input";
import { Tabs } from "@/shared/components/ui/Tabs";
import { Modal } from "@/shared/components/ui/Modal";
import { Field } from "@/shared/components/form/Field";
import { Select } from "@/shared/components/form/Select";
import { Checkbox } from "@/shared/components/form/Checkbox";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { Icon } from "@/shared/components/ui/Icon";
import {
  getStoredHorses,
  addStoredHorse,
  deleteStoredHorse,
  clearAllStoredHorses,
  type HerdHorse,
} from "@/shared/mock/horsesData";

const GROUP_CONFIG = {
  FIT: { label: "Fit for Training", color: "var(--ok)", bg: "rgba(34, 197, 94, 0.1)", border: "var(--ok)" },
  WATCH: { label: "Under Observation", color: "var(--warn)", bg: "rgba(234, 179, 8, 0.1)", border: "var(--warn)" },
  INJURED: { label: "Injured", color: "var(--danger)", bg: "rgba(239, 68, 68, 0.1)", border: "var(--danger)" },
  QUARANTINED: { label: "Quarantined", color: "#a855f7", bg: "rgba(168, 85, 247, 0.1)", border: "#a855f7" },
};

export default function HerdHealthPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isVet = user?.role === "VETERINARIAN";

  const [horses, setHorses] = useState<HerdHorse[]>([]);
  const [filterGroup, setFilterGroup] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const [searchSuggestionsOpen, setSearchSuggestionsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Add Horse Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [horseName, setHorseName] = useState("");
  const [horseCode, setHorseCode] = useState("");
  const [stall, setStall] = useState("");
  const [healthGroup, setHealthGroup] = useState<"FIT" | "WATCH" | "INJURED" | "QUARANTINED">("FIT");
  const [statusText, setStatusText] = useState("Ready for competition");
  const [restingHeartRate, setRestingHeartRate] = useState(36);
  const [temp, setTemp] = useState(37.8);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState("");

  // Delete Horse Modal
  const [deleteHorseTarget, setDeleteHorseTarget] = useState<HerdHorse | null>(null);
  // Clear All Modal
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  useEffect(() => {
    setHorses(getStoredHorses());
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleCreateHorse() {
    if (!horseName.trim() || !horseCode.trim()) {
      toast.show("Please enter horse name and code.", "warn");
      return;
    }
    const newHorse: HerdHorse = {
      id: `horse-${Date.now()}`,
      name: horseName.trim(),
      code: horseCode.trim().toUpperCase(),
      stall: stall.trim() || "Stall A-01",
      healthGroup,
      statusText: statusText.trim() || "Active",
      isLocked,
      lockReason: isLocked ? lockReason.trim() : undefined,
      restingHeartRate: Number(restingHeartRate) || 36,
      temp: Number(temp) || 37.8,
    };
    addStoredHorse(newHorse);
    setHorses(getStoredHorses());
    window.dispatchEvent(new Event("horsesUpdated"));
    setShowAddModal(false);
    resetForm();
    toast.show(`Horse "${newHorse.name}" created successfully.`, "ok");
  }

  function handleDeleteHorse() {
    if (!deleteHorseTarget) return;
    deleteStoredHorse(deleteHorseTarget.id);
    setHorses(getStoredHorses());
    window.dispatchEvent(new Event("horsesUpdated"));
    toast.show(`Horse "${deleteHorseTarget.name}" removed from stable.`, "ok");
    setDeleteHorseTarget(null);
  }

  function handleClearAll() {
    clearAllStoredHorses();
    setHorses([]);
    window.dispatchEvent(new Event("horsesUpdated"));
    setShowClearAllModal(false);
    toast.show("All horses and injury records cleared from database.", "ok");
  }

  function resetForm() {
    setHorseName("");
    setHorseCode("");
    setStall("");
    setHealthGroup("FIT");
    setStatusText("Ready for competition");
    setRestingHeartRate(36);
    setTemp(37.8);
    setIsLocked(false);
    setLockReason("");
  }

  function handleQuickFill(sampleType: "fit" | "injured" | "quarantined") {
    if (sampleType === "fit") {
      setHorseName("Thunderbolt Swift");
      setHorseCode("EQ-001");
      setStall("Stall A-01");
      setHealthGroup("FIT");
      setStatusText("Ready for competition");
      setRestingHeartRate(34);
      setTemp(37.8);
      setIsLocked(false);
      setLockReason("");
    } else if (sampleType === "injured") {
      setHorseName("Northern Dancer Legacy");
      setHorseCode("EQ-002");
      setStall("Stall A-02");
      setHealthGroup("INJURED");
      setStatusText("Superficial flexor tendon desmitis");
      setRestingHeartRate(42);
      setTemp(38.2);
      setIsLocked(true);
      setLockReason("Grade 1 tendon sheath inflammation, strict stall rest");
    } else {
      setHorseName("Flying Swallow");
      setHorseCode("EQ-005");
      setStall("Stall D-01");
      setHealthGroup("QUARANTINED");
      setStatusText("Epidemiological quarantine");
      setRestingHeartRate(46);
      setTemp(39.0);
      setIsLocked(true);
      setLockReason("Elevated temperature, viral quarantine protocol");
    }
  }

  const filtered = horses.filter((h) => {
    const matchesGroup = filterGroup === "ALL" ? true : h.healthGroup === filterGroup;
    const matchesSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.code.toLowerCase().includes(search.toLowerCase()) ||
      h.stall.toLowerCase().includes(search.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Herd Health Status Matrix</h1>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {isVet && (
            <Button tone="primary" icon="plus" onClick={() => setShowAddModal(true)}>
              Add Horse
            </Button>
          )}
          {isVet && horses.length > 0 && (
            <Button tone="ghost" icon="trash" onClick={() => setShowClearAllModal(true)} title="Clear all horses from local database">
              Clear All Horses
            </Button>
          )}
          {isVet && (
            <Link to="/medical/locks">
              <Button tone="secondary">Training Locks</Button>
            </Link>
          )}
          <Link to="/medical/care-schedules">
            <Button tone="ghost">Preventive Care</Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)", borderLeft: `4px solid ${GROUP_CONFIG.FIT.border}` }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Fit for Work / Competition</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: GROUP_CONFIG.FIT.color }}>
            {horses.filter((h) => h.healthGroup === "FIT").length} horses
          </div>
        </div>
        <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)", borderLeft: `4px solid ${GROUP_CONFIG.WATCH.border}` }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Requires Monitoring</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: GROUP_CONFIG.WATCH.color }}>
            {horses.filter((h) => h.healthGroup === "WATCH").length} horses
          </div>
        </div>
        <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)", borderLeft: `4px solid ${GROUP_CONFIG.INJURED.border}` }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Medical Injury</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: GROUP_CONFIG.INJURED.color }}>
            {horses.filter((h) => h.healthGroup === "INJURED").length} horses
          </div>
        </div>
        <div style={{ padding: "1rem", background: "var(--surface)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)", borderLeft: `4px solid ${GROUP_CONFIG.QUARANTINED.border}` }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Quarantine Isolation</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: GROUP_CONFIG.QUARANTINED.color }}>
            {horses.filter((h) => h.healthGroup === "QUARANTINED").length} horses
          </div>
        </div>
      </div>

      {/* Filters & Search Container (overflow visible ensures suggestion dropdown floats naturally) */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: "var(--r-lg)",
          padding: "16px",
          boxShadow: "var(--shadow-sm)",
          position: "relative",
          zIndex: 35,
          overflow: "visible",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <Tabs
            items={[
              { id: "ALL", label: `All (${horses.length})` },
              { id: "FIT", label: `Fit (${horses.filter((h) => h.healthGroup === "FIT").length})` },
              { id: "WATCH", label: `Observation (${horses.filter((h) => h.healthGroup === "WATCH").length})` },
              { id: "INJURED", label: `Injured (${horses.filter((h) => h.healthGroup === "INJURED").length})` },
              { id: "QUARANTINED", label: `Quarantine (${horses.filter((h) => h.healthGroup === "QUARANTINED").length})` },
            ]}
            active={filterGroup}
            onChange={setFilterGroup}
          />

          {/* Search Input (Clean design without magnifying glass icon, with interactive suggestions popover) */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }} ref={searchContainerRef}>
            <input
              type="text"
              placeholder="Search horse name, stall, or code..."
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
                width: 310,
                height: 38,
                padding: "0 34px 0 14px",
                borderRadius: 10,
                border: "1px solid #e2ddd7",
                background: "#ffffff",
                fontSize: "0.82rem",
                color: "#1a1615",
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
                  right: 9,
                  background: "none",
                  border: "none",
                  color: "#8c827a",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Icon name="x" size={13} />
              </button>
            )}

            {/* Quick Suggestions Popover */}
            {searchSuggestionsOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 6px)",
                  width: 330,
                  maxWidth: "92vw",
                  background: "#ffffff",
                  border: "1px solid #ede8e3",
                  borderRadius: 14,
                  boxShadow: "0 18px 40px rgba(0, 0, 0, 0.16)",
                  zIndex: 100,
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

                <div style={{ padding: "6px 0", maxHeight: 360, overflowY: "auto" }}>
                  {(() => {
                    if (horses.length === 0) {
                      return (
                        <div style={{ padding: "1.75rem 1rem", textAlign: "center", color: "#8c827a", fontSize: "0.82rem" }}>
                          <div style={{ fontSize: "1.6rem", marginBottom: 6 }}>🐴</div>
                          <div style={{ fontWeight: 700, color: "#1a1615", fontSize: "0.9rem" }}>
                            No horses in stable database
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "#a89f97", marginTop: 4, lineHeight: 1.45 }}>
                            All search suggestions are strictly derived from active horses and clinical care. Click &quot;Add Horse&quot; to register horses.
                          </div>
                        </div>
                      );
                    }

                    const q = search.trim().toLowerCase();

                    // 1. Horses matching name, code, stall, health group, status text, or lock reason
                    const matchingHorses = horses.filter((h) => {
                      if (!q) return true;
                      return (
                        h.name.toLowerCase().includes(q) ||
                        h.code.toLowerCase().includes(q) ||
                        (h.stall && h.stall.toLowerCase().includes(q)) ||
                        (h.healthGroup && h.healthGroup.toLowerCase().includes(q)) ||
                        (h.statusText && h.statusText.toLowerCase().includes(q)) ||
                        (h.lockReason && h.lockReason.toLowerCase().includes(q))
                      );
                    });

                    // 2. Stalls matching query or housing a matching horse
                    const allStalls = Array.from(new Set(horses.map((h) => h.stall).filter(Boolean)));
                    const matchingStalls = allStalls.filter((s) => {
                      if (!q) return true;
                      const stallMatches = s.toLowerCase().includes(q);
                      const horseInStallMatches = horses.some(
                        (h) => h.stall === s && (h.name.toLowerCase().includes(q) || h.code.toLowerCase().includes(q))
                      );
                      return stallMatches || horseInStallMatches;
                    });

                    // 3. Health status shortcuts - ONLY for statuses that actually have existing horses
                    const healthShortcuts = [
                      { label: "Injured Horses", val: "Injured", count: horses.filter((h) => h.healthGroup === "INJURED").length },
                      { label: "Training Locked", val: "Lock", count: horses.filter((h) => h.isLocked).length },
                      { label: "Under Observation", val: "Observation", count: horses.filter((h) => h.healthGroup === "WATCH").length },
                      { label: "Quarantine Isolation", val: "Quarantine", count: horses.filter((h) => h.healthGroup === "QUARANTINED").length },
                      { label: "Fit for Work", val: "Fit", count: horses.filter((h) => h.healthGroup === "FIT").length },
                    ].filter((item) => {
                      if (item.count === 0) return false;
                      if (!q) return true;
                      return item.label.toLowerCase().includes(q) || item.val.toLowerCase().includes(q);
                    });

                    const totalMatches = matchingHorses.length + matchingStalls.length + healthShortcuts.length;

                    if (totalMatches === 0) {
                      return (
                        <div style={{ padding: "1.75rem 1rem", textAlign: "center", color: "#8c827a", fontSize: "0.82rem" }}>
                          <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>🔍</div>
                          <div style={{ fontWeight: 700, color: "#1a1615", fontSize: "0.9rem" }}>
                            No results for &quot;<strong>{search}</strong>&quot;
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "#a89f97", marginTop: 4 }}>
                            Try searching by letter, horse code (EQ-), stall, or status
                          </div>
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* Matching Horses */}
                        {matchingHorses.length > 0 && (
                          <div>
                            <div style={{ padding: "4px 14px 2px", fontSize: "0.68rem", fontWeight: 700, color: "#8c827a", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                              Horses ({matchingHorses.length})
                            </div>
                            {matchingHorses.map((horse) => (
                              <div
                                key={horse.id}
                                onClick={() => {
                                  setSearch(horse.name);
                                  setSearchSuggestionsOpen(false);
                                }}
                                style={{
                                  padding: "7px 14px",
                                  cursor: "pointer",
                                  fontSize: "0.79rem",
                                  color: "#1a1615",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  transition: "background 0.12s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#fbf5ee")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                                  <span style={{ color: "#731b24", fontSize: "0.9rem" }}>🐴</span>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {horse.name}
                                      </span>
                                      <span style={{ fontSize: "0.73rem", color: "#8c827a", flexShrink: 0 }}>
                                        ({horse.code})
                                      </span>
                                    </div>
                                    <div style={{ fontSize: "0.7rem", color: "#8c827a" }}>
                                      {horse.stall}
                                      {horse.statusText && horse.healthGroup !== "FIT" ? ` • ${horse.statusText}` : ""}
                                    </div>
                                  </div>
                                </div>
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    fontWeight: 600,
                                    padding: "2px 6px",
                                    borderRadius: 6,
                                    background: GROUP_CONFIG[horse.healthGroup]?.bg || "#f3f4f6",
                                    color: GROUP_CONFIG[horse.healthGroup]?.color || "#4b5563",
                                    flexShrink: 0,
                                    marginLeft: 6,
                                  }}
                                >
                                  {horse.isLocked ? "LOCK" : GROUP_CONFIG[horse.healthGroup]?.label || horse.healthGroup}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Matching Stalls */}
                        {matchingStalls.length > 0 && (
                          <div>
                            <div style={{ padding: "8px 14px 2px", fontSize: "0.68rem", fontWeight: 700, color: "#8c827a", textTransform: "uppercase", letterSpacing: "0.03em", borderTop: "1px solid #f6f2ef", marginTop: 4 }}>
                              Stalls & Barns ({matchingStalls.length})
                            </div>
                            {matchingStalls.map((stallName) => {
                              const count = horses.filter((h) => h.stall === stallName).length;
                              return (
                                <div
                                  key={stallName}
                                  onClick={() => {
                                    setSearch(stallName);
                                    setSearchSuggestionsOpen(false);
                                  }}
                                  style={{
                                    padding: "7px 14px",
                                    cursor: "pointer",
                                    fontSize: "0.79rem",
                                    color: "#1a1615",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    transition: "background 0.12s ease",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fbf5ee")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                    <span style={{ color: "#731b24", fontSize: "0.9rem" }}>🏠</span>
                                    <span style={{ fontWeight: 600 }}>{stallName}</span>
                                  </div>
                                  <span style={{ fontSize: "0.72rem", color: "#8c827a" }}>
                                    {count} {count === 1 ? "horse" : "horses"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Health Status Shortcuts */}
                        {healthShortcuts.length > 0 && (
                          <div>
                            <div style={{ padding: "8px 14px 2px", fontSize: "0.68rem", fontWeight: 700, color: "#8c827a", textTransform: "uppercase", letterSpacing: "0.03em", borderTop: "1px solid #f6f2ef", marginTop: 4 }}>
                              Health & Status Filters
                            </div>
                            {healthShortcuts.map((sc) => (
                              <div
                                key={sc.val}
                                onClick={() => {
                                  setSearch(sc.val);
                                  setSearchSuggestionsOpen(false);
                                }}
                                style={{
                                  padding: "7px 14px",
                                  cursor: "pointer",
                                  fontSize: "0.79rem",
                                  color: "#1a1615",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  transition: "background 0.12s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#fbf5ee")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                  <span style={{ color: "#731b24", fontSize: "0.9rem" }}>🩺</span>
                                  <span>{sc.label}</span>
                                </div>
                                <span style={{ fontSize: "0.72rem", color: "#8c827a", background: "#f3f4f6", padding: "1px 6px", borderRadius: 10 }}>
                                  {sc.count}
                                </span>
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
        </div>
      </div>

      {/* Empty State when no horses exist */}
      {filtered.length === 0 ? (
        <div
          style={{
            padding: "3.5rem 2rem",
            textAlign: "center",
            background: "var(--surface)",
            border: "1px dashed var(--border)",
            borderRadius: "var(--radius-card)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
          }}
        >
          <Icon name="horse" size={52} style={{ color: "var(--muted)", opacity: 0.5 }} />
          <div>
            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
              {horses.length === 0 ? "No horses in stable database" : "No matching horses found"}
            </h3>
            <p style={{ margin: "0.5rem 0 0", color: "var(--muted)", fontSize: "0.875rem", maxWidth: 460 }}>
              {horses.length === 0
                ? "No horses exist by default. Click \"Add Horse\" to register a horse with customized health status and independent 2D injury tracking."
                : "No horses match your current filter or search criteria."}
            </p>
          </div>
          {horses.length === 0 && (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
              <Button tone="primary" icon="plus" onClick={() => setShowAddModal(true)}>
                Add New Horse
              </Button>
              <Button tone="secondary" onClick={() => { handleQuickFill("fit"); setShowAddModal(true); }}>
                Sample Fit Horse
              </Button>
              <Button tone="secondary" onClick={() => { handleQuickFill("injured"); setShowAddModal(true); }}>
                Sample Injured Horse
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Grid of Horse Health Cards */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {filtered.map((horse) => {
            const cfg = GROUP_CONFIG[horse.healthGroup];
            return (
              <div
                key={horse.id}
                style={{
                  padding: "1.25rem",
                  background: "var(--surface)",
                  borderRadius: "var(--radius-card)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  position: "relative",
                  border: horse.isLocked ? "2px solid var(--danger)" : "1px solid var(--border)",
                }}
              >
                {/* Card Header with Name, Badges & Delete Button */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, lineHeight: 1.35, wordBreak: "break-word" }}>
                      <Link to={`/medical/horses/${horse.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {horse.name}
                      </Link>
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem", fontSize: "0.8125rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, color: "var(--brand)" }}>{horse.code}</span>
                      <span>•</span>
                      <span>Stall: <strong>{horse.stall}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {horse.isLocked && (
                      <div
                        style={{
                          flexShrink: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "6px",
                          background: "rgba(239, 68, 68, 0.12)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          color: "var(--danger)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        🔒 TRAINING LOCK
                      </div>
                    )}

                    {isVet && (
                      <button
                        type="button"
                        title="Delete horse"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteHorseTarget(horse);
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "var(--muted)",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "4px",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status pill */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.75rem",
                      borderRadius: 999,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: cfg.color,
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                    }}
                  >
                    {cfg.label}: {horse.statusText}
                  </span>
                </div>

                {/* Vitals quick view */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    background: "var(--surface-sunken)",
                    borderRadius: 6,
                    fontSize: "0.8125rem",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Resting HR:</span>{" "}
                    <strong>{horse.restingHeartRate} bpm</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Temperature:</span>{" "}
                    <strong>{horse.temp} °C</strong>
                  </div>
                </div>

                {horse.lockReason && (
                  <div style={{ fontSize: "0.75rem", color: "var(--danger)", background: "rgba(239, 68, 68, 0.05)", padding: "0.5rem", borderRadius: 4 }}>
                    <strong>Reason:</strong> {horse.lockReason}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                  <Link to={`/medical/horses/${horse.id}`} style={{ flex: 1 }}>
                    <Button tone="secondary" style={{ width: "100%" }}>
                      Medical Profile (6 Tabs)
                    </Button>
                  </Link>
                  <Link to={`/medical/horses/${horse.id}/injuries`}>
                    <Button tone="ghost">2D Injury Map</Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add Horse */}
      {showAddModal && (
        <Modal
          title="Add New Horse to Stable"
          subtitle="Register horse details, stall assignment, and clinical status"
          width={520}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
          foot={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <Button size="sm" tone="ghost" onClick={() => handleQuickFill("fit")}>
                  Fill Fit
                </Button>
                <Button size="sm" tone="ghost" onClick={() => handleQuickFill("injured")}>
                  Fill Injured
                </Button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button tone="ghost" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button tone="primary" icon="plus" onClick={handleCreateHorse}>
                  Create Horse
                </Button>
              </div>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Horse Name *">
                <Input
                  value={horseName}
                  onChange={(e) => setHorseName(e.target.value)}
                  placeholder="e.g. Northern Dancer"
                  required
                />
              </Field>

              <Field label="Code / RFID *">
                <Input
                  value={horseCode}
                  onChange={(e) => setHorseCode(e.target.value)}
                  placeholder="e.g. EQ-001 or RFID-985..."
                  required
                />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Stall Location">
                <Input
                  value={stall}
                  onChange={(e) => setStall(e.target.value)}
                  placeholder="e.g. Stall A-02"
                />
              </Field>

              <Field label="Clinical Health Group *">
                <Select
                  options={[
                    { value: "FIT", label: "Fit for Training" },
                    { value: "WATCH", label: "Under Observation" },
                    { value: "INJURED", label: "Injured" },
                    { value: "QUARANTINED", label: "Quarantined" },
                  ]}
                  value={healthGroup}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setHealthGroup(val);
                    if (val === "INJURED" || val === "QUARANTINED") {
                      setIsLocked(true);
                    }
                  }}
                />
              </Field>
            </div>

            <Field label="Status Description / Clinical Finding">
              <Input
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                placeholder="e.g. Ready for competition, Superficial tendonitis..."
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Resting HR (bpm)">
                <Input
                  type="number"
                  min={20}
                  max={120}
                  value={restingHeartRate}
                  onChange={(e) => setRestingHeartRate(Number(e.target.value))}
                />
              </Field>

              <Field label="Temperature (°C)">
                <Input
                  type="number"
                  step="0.1"
                  min={35}
                  max={43}
                  value={temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                />
              </Field>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              <Checkbox
                label="Apply Protective Training Lock"
                checked={isLocked}
                onChange={setIsLocked}
              />
              {isLocked && (
                <div style={{ marginTop: 8 }}>
                  <Field label="Lock Reason *">
                    <Input
                      value={lockReason}
                      onChange={(e) => setLockReason(e.target.value)}
                      placeholder="Reason for suspension of training..."
                    />
                  </Field>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Delete Horse Confirmation */}
      {deleteHorseTarget && (
        <Modal
          title="Delete Horse from Stable"
          subtitle="Confirm removal from active herd registry"
          width={440}
          onClose={() => setDeleteHorseTarget(null)}
          foot={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
              <Button tone="ghost" onClick={() => setDeleteHorseTarget(null)}>
                Cancel
              </Button>
              <Button tone="danger" icon="trash" onClick={handleDeleteHorse}>
                Delete Horse
              </Button>
            </div>
          }
        >
          <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
            Are you sure you want to delete <strong>{deleteHorseTarget.name}</strong> ({deleteHorseTarget.code})?
            <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: 8 }}>
              This will remove the horse profile and its associated 2D injury map from the system.
            </p>
          </div>
        </Modal>
      )}

      {/* Modal Clear All Horses Confirmation */}
      {showClearAllModal && (
        <Modal
          title="Clear All Horses from Stable"
          subtitle="Confirm complete reset of horse and injury database"
          width={460}
          onClose={() => setShowClearAllModal(false)}
          foot={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
              <Button tone="ghost" onClick={() => setShowClearAllModal(false)}>
                Cancel
              </Button>
              <Button tone="danger" icon="trash" onClick={handleClearAll}>
                Confirm Clear Database
              </Button>
            </div>
          }
        >
          <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
            Are you sure you want to clear all <strong>{horses.length}</strong> horses and their associated 2D injury maps?
            <p style={{ color: "var(--danger)", fontSize: "13px", marginTop: 8 }}>
              This will reset the stable database to 0 horses. You will need to create new horses manually.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
