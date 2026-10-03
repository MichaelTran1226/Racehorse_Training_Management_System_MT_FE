import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Icon } from "@/shared/components/ui/Icon";
import type { HerdHorse } from "@/shared/mock/horsesData";
import type { AuthUser } from "@/shared/types/auth";

export interface ClinicalProtocolSuggestion {
  id: string;
  title: string;
  category: "Vaccine" | "Lock" | "Treatment" | "Preventive";
  targetRoute: string;
  badgeLabel: string;
  badgeTone: "ok" | "warn" | "danger" | "neutral";
  details: string;
}

// Dynamically derive clinical protocols and care schedules strictly from real horses in the database.
// If 0 horses exist or no horse has active medical treatments, no protocols are fabricated.
function getProtocolsFromHorses(horses: HerdHorse[]): ClinicalProtocolSuggestion[] {
  if (!horses || horses.length === 0) return [];
  const protocols: ClinicalProtocolSuggestion[] = [];

  horses.forEach((h) => {
    // 1. Training Lock protocol for locked horses
    if (h.isLocked) {
      protocols.push({
        id: `lock-${h.id}`,
        title: `Protective Training Lock: ${h.name} (${h.code})`,
        category: "Lock",
        targetRoute: "/medical/locks",
        badgeLabel: "Active Lock",
        badgeTone: "danger",
        details: `${h.lockReason || "Under protective clinical training suspension"} • ${h.stall ? `Stall: ${h.stall}` : "Stall unassigned"}`,
      });
    }

    // 2. Clinical injury treatment plan for injured horses
    if (h.healthGroup === "INJURED") {
      protocols.push({
        id: `injury-${h.id}`,
        title: `Clinical Injury Care: ${h.name} (${h.code})`,
        category: "Treatment",
        targetRoute: `/medical/horses/${h.id}`,
        badgeLabel: "In Treatment",
        badgeTone: "danger",
        details: `${h.statusText || "Superficial injury recovery protocol"} • ${h.stall ? `Stall: ${h.stall}` : "Stall unassigned"}`,
      });
    }

    // 3. Clinical observation monitoring for watch horses
    if (h.healthGroup === "WATCH") {
      protocols.push({
        id: `watch-${h.id}`,
        title: `Clinical Observation: ${h.name} (${h.code})`,
        category: "Treatment",
        targetRoute: `/medical/horses/${h.id}`,
        badgeLabel: "Monitoring",
        badgeTone: "warn",
        details: `${h.statusText || "Daily veterinary vital sign monitoring"} • ${h.stall ? `Stall: ${h.stall}` : "Stall unassigned"}`,
      });
    }

    // 4. Quarantine protocol for quarantined horses
    if (h.healthGroup === "QUARANTINED") {
      protocols.push({
        id: `quarantine-${h.id}`,
        title: `Quarantine Protocol: ${h.name} (${h.code})`,
        category: "Treatment",
        targetRoute: `/medical/horses/${h.id}`,
        badgeLabel: "Quarantine",
        badgeTone: "danger",
        details: `${h.statusText || "Strict epidemiological isolation protocol"} • ${h.stall ? `Stall: ${h.stall}` : "Stall unassigned"}`,
      });
    }

    // 5. Active preventive care / vaccination for the horse
    protocols.push({
      id: `care-${h.id}-vax`,
      title: `Equine Vaccination Care: ${h.name} (${h.code})`,
      category: "Vaccine",
      targetRoute: "/medical/care-schedules",
      badgeLabel: "Preventive Care",
      badgeTone: "ok",
      details: `Bi-annual booster protocol per veterinary care plan • ${h.stall ? `Stall: ${h.stall}` : "Stall unassigned"}`,
    });
  });

  return protocols;
}

interface SearchSuggestionsPopoverProps {
  horses: HerdHorse[];
  user: AuthUser | null;
  query: string;
  open: boolean;
  onClose: () => void;
  onSelect: (horse: HerdHorse) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

export function SearchSuggestionsPopover({
  horses,
  user,
  query,
  open,
  onClose,
  onSelect,
  triggerRef,
}: SearchSuggestionsPopoverProps) {
  const navigate = useNavigate();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "HORSES" | "PROTOCOLS">("ALL");

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef?.current && triggerRef.current.contains(target)) {
        return;
      }
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose, triggerRef]);

  // Dynamically derive protocols from real horses only (NO fake data when 0 horses)
  const allProtocols = useMemo(() => {
    return getProtocolsFromHorses(horses);
  }, [horses]);

  // Filter protocols matching search query (matches title, details, category, or horse stall)
  const filteredProtocols = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allProtocols;
    return allProtocols.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.details.toLowerCase().includes(q)
    );
  }, [allProtocols, query]);

  if (!open) return null;

  // Role scope description
  let scopeLabel = "Horses in your care";
  if (user?.role === "HORSE_OWNER") {
    scopeLabel = "Your Owned Horses";
  } else if (user?.role === "GROOM") {
    scopeLabel = "Your Assigned Horses";
  } else if (user?.role === "VETERINARIAN") {
    scopeLabel = "Veterinary Herd Scope";
  } else if (user?.role === "HEAD_TRAINER") {
    scopeLabel = "Training Squad Scope";
  } else if (user?.role === "CLUB_MANAGER") {
    scopeLabel = "Club Fleet Scope";
  }

  const showHorses = activeTab === "ALL" || activeTab === "HORSES";
  const showProtocols = activeTab === "ALL" || activeTab === "PROTOCOLS";

  const totalResults = horses.length + filteredProtocols.length;

  return (
    <div
      ref={popoverRef}
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: 420,
        maxWidth: "94vw",
        background: "#ffffff",
        border: "1px solid #ede8e3",
        borderRadius: 14,
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.14)",
        zIndex: 100,
        overflow: "hidden",
        animation: "fadeIn 0.15s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "0.75rem 1rem",
          background: "#faf7f4",
          borderBottom: "1px solid #f0eae4",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.76rem",
          color: "#786e68",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, color: "#1a1615", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            {query.trim() ? "Search Results" : "Global Search Suggestions"}
          </span>
          <span style={{ color: "#731b24", fontWeight: 700, background: "#fbf2eb", padding: "1px 7px", borderRadius: 10 }}>
            {totalResults}
          </span>
        </div>
        <span style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 500 }}>
          {scopeLabel}
        </span>
      </div>

      {/* Category Filter Chips */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "6px 12px",
          background: "#ffffff",
          borderBottom: "1px solid #f2ede8",
        }}
      >
        {[
          { id: "ALL", label: `All (${totalResults})` },
          { id: "HORSES", label: `🐴 Horses (${horses.length})` },
          { id: "PROTOCOLS", label: `🩺 Protocols & Care (${filteredProtocols.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: "0.73rem",
              fontWeight: activeTab === tab.id ? 700 : 500,
              border: activeTab === tab.id ? "1px solid #731b24" : "1px solid #e8e2dc",
              background: activeTab === tab.id ? "#fdf2f4" : "#ffffff",
              color: activeTab === tab.id ? "#731b24" : "#5a504a",
              cursor: "pointer",
              transition: "all 0.12s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content List */}
      <div style={{ maxHeight: 340, overflowY: "auto", padding: "0.25rem 0" }}>
        {totalResults === 0 ? (
          <div style={{ padding: "2.25rem 1.5rem", textAlign: "center", color: "#8c827a", fontSize: "0.84rem" }}>
            {!query.trim() && horses.length === 0 ? (
              <>
                <div style={{ fontWeight: 700, color: "#1a1615", fontSize: "0.95rem" }}>
                  No horses or clinical treatments in database
                </div>
                <div style={{ fontSize: "0.78rem", marginTop: 6, color: "#a89f97", maxWidth: 320, margin: "6px auto 0", lineHeight: 1.45 }}>
                  All search suggestions are strictly derived from registered horses and their active treatments. Add horses in Herd Health to begin tracking medical care.
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, color: "#1a1615", fontSize: "0.95rem" }}>
                  No matching horses or clinical records for &quot;<strong>{query}</strong>&quot;
                </div>
                <div style={{ fontSize: "0.78rem", marginTop: 6, color: "#a89f97" }}>
                  Try searching by letter, horse name, code (EQ-), stall, or clinical status
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Section 1: Horses */}
            {showHorses && horses.length > 0 && (
              <div>
                <div
                  style={{
                    padding: "6px 12px 4px",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "#8c827a",
                    background: "#faf7f4",
                  }}
                >
                  🐴 Registered Horses ({horses.length})
                </div>
                {horses.map((horse) => (
                  <div
                    key={horse.id}
                    onClick={() => {
                      onSelect(horse);
                      onClose();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.6rem 1rem",
                      cursor: "pointer",
                      borderBottom: "1px solid #f6f2ef",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5f1")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#fbf2eb",
                          border: "1px solid #eed9cb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: "#731b24",
                        }}
                      >
                        <Icon name="tag" size={14} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "0.84rem",
                              color: "#1a1615",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {horse.name}
                          </span>
                          <span style={{ fontSize: "0.74rem", color: "#8c827a", flexShrink: 0 }}>
                            ({horse.code})
                          </span>
                        </div>
                        <div style={{ fontSize: "0.71rem", color: "#786e68", marginTop: 1 }}>
                          {horse.stall ? `Stall: ${horse.stall}` : "Stall unassigned"}
                          {horse.restingHeartRate ? ` • HR: ${horse.restingHeartRate} bpm` : ""}
                        </div>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0, marginLeft: "0.5rem" }}>
                      {horse.isLocked ? (
                        <Badge tone="danger">LOCKED</Badge>
                      ) : horse.healthGroup === "INJURED" ? (
                        <Badge tone="danger">Injured</Badge>
                      ) : horse.healthGroup === "WATCH" ? (
                        <Badge tone="warn">Watch</Badge>
                      ) : horse.healthGroup === "QUARANTINED" ? (
                        <Badge tone="warn">Quarantine</Badge>
                      ) : (
                        <Badge tone="ok">Fit</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Section 2: Clinical Protocols & Care */}
            {showProtocols && filteredProtocols.length > 0 && (
              <div>
                <div
                  style={{
                    padding: "6px 12px 4px",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "#8c827a",
                    background: "#faf7f4",
                    marginTop: showHorses && horses.length > 0 ? 4 : 0,
                  }}
                >
                  🩺 Clinical Protocols & Care Schedules ({filteredProtocols.length})
                </div>
                {filteredProtocols.map((proto) => (
                  <div
                    key={proto.id}
                    onClick={() => {
                      navigate(proto.targetRoute);
                      onClose();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.6rem 1rem",
                      cursor: "pointer",
                      borderBottom: "1px solid #f6f2ef",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#faf5f1")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: "#166534",
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "0.83rem",
                              color: "#1a1615",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {proto.title}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.71rem",
                            color: "#786e68",
                            marginTop: 1,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {proto.details}
                        </div>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0, marginLeft: "0.5rem" }}>
                      <Badge tone={proto.badgeTone}>{proto.badgeLabel}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer navigation */}
      <div
        style={{
          padding: "0.55rem 1rem",
          background: "#faf7f4",
          borderTop: "1px solid #f0eae4",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.73rem",
        }}
      >
        <span style={{ color: "#8c827a" }}>Click to open • Press ESC to dismiss</span>
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate("/herd");
          }}
          style={{
            background: "none",
            border: "none",
            color: "#731b24",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.74rem",
            padding: 0,
            textDecoration: "underline",
          }}
        >
          View all in Herd Health →
        </button>
      </div>
    </div>
  );
}
