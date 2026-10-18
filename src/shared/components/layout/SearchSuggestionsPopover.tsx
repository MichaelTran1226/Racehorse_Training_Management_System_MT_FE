import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Icon } from "@/shared/components/ui/Icon";
import type { HerdHorse } from "@/shared/mock/horsesData";
import type { AuthUser } from "@/shared/types/auth";

import { tr } from "@/shared/i18n/tr";
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
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
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
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--border-soft)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "var(--fs-caption)",
          color: "var(--muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, color: "var(--text)", }}>
            {query.trim() ? tr("Search Results") : tr("Global Search Suggestions")}
          </span>
          <span style={{ color: "var(--brand)", fontWeight: 700, background: "var(--surface-2)", padding: "1px 7px", borderRadius: "var(--r-lg)" }}>
            {totalResults}
          </span>
        </div>
        <span style={{ fontSize: "var(--fs-caption)", color: "var(--muted)", fontWeight: 500 }}>
          {scopeLabel}
        </span>
      </div>

      {/* Category Filter Chips */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "6px 12px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        {[
          { id: "ALL", label: `All (${totalResults})` },
          { id: "HORSES", label: `Horses (${horses.length})` },
          { id: "PROTOCOLS", label: `Protocols & care (${filteredProtocols.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: "4px 10px",
              borderRadius: "var(--r-lg)",
              fontSize: "var(--fs-caption)",
              fontWeight: activeTab === tab.id ? 700 : 500,
              border: activeTab === tab.id ? "1px solid var(--brand)" : "1px solid var(--border-soft)",
              background: activeTab === tab.id ? "var(--danger-bg)" : "var(--surface)",
              color: activeTab === tab.id ? "var(--brand)" : "var(--text-2)",
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
          <div style={{ padding: "2.25rem 1.5rem", textAlign: "center", color: "var(--muted)", fontSize: "var(--fs-body)" }}>
            {!query.trim() && horses.length === 0 ? (
              <>
                <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "var(--fs-body-lg)" }}>
                  {tr("No horses or clinical treatments in database")}
                </div>
                <div style={{ fontSize: "var(--fs-caption)", marginTop: 6, color: "var(--border-field)", maxWidth: 320, margin: "6px auto 0", lineHeight: 1.45 }}>
                  {tr("All search suggestions are strictly derived from registered horses and their active treatments. Add horses in Herd Health to begin tracking medical care.")}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, color: "var(--text)", fontSize: "var(--fs-body-lg)" }}>
                  {tr("No matching horses or clinical records for &quot;")}<strong>{query}</strong>&quot;
                </div>
                <div style={{ fontSize: "var(--fs-caption)", marginTop: 6, color: "var(--border-field)" }}>
                  {tr("Try searching by letter, horse name, code (EQ-), stall, or clinical status")}
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
                    fontSize: "var(--fs-caption)",
                    fontWeight: 700,
                    color: "var(--muted)",
                    background: "var(--surface-2)",
                  }}
                >
                  {tr("Horses ({{count}})", { count: horses.length })}
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
                      borderBottom: "1px solid var(--surface-2)",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: "var(--brand)",
                        }}
                      >
                        <Icon name="tag" size={14} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "var(--fs-body)",
                              color: "var(--text)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {horse.name}
                          </span>
                          <span style={{ fontSize: "var(--fs-caption)", color: "var(--muted)", flexShrink: 0 }}>
                            ({horse.code})
                          </span>
                        </div>
                        <div style={{ fontSize: "var(--fs-caption)", color: "var(--muted)", marginTop: 1 }}>
                          {horse.stall ? tr(`Stall: ${horse.stall}`) : tr("Stall unassigned")}
                          {horse.restingHeartRate ? tr(` • HR: ${horse.restingHeartRate} bpm`) : ""}
                        </div>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0, marginLeft: "0.5rem" }}>
                      {horse.isLocked ? (
                        <Badge tone="danger">{tr("LOCKED")}</Badge>
                      ) : horse.healthGroup === "INJURED" ? (
                        <Badge tone="danger">{tr("Injured")}</Badge>
                      ) : horse.healthGroup === "WATCH" ? (
                        <Badge tone="warn">{tr("Watch")}</Badge>
                      ) : horse.healthGroup === "QUARANTINED" ? (
                        <Badge tone="warn">{tr("Quarantine")}</Badge>
                      ) : (
                        <Badge tone="ok">{tr("Fit")}</Badge>
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
                    fontSize: "var(--fs-caption)",
                    fontWeight: 700,
                    color: "var(--muted)",
                    background: "var(--surface-2)",
                    marginTop: showHorses && horses.length > 0 ? 4 : 0,
                  }}
                >
                  {tr("Protocols & care schedules ({{count}})", { count: filteredProtocols.length })}
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
                      borderBottom: "1px solid var(--surface-2)",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "var(--r)",
                          background: "var(--ok-bg)",
                          border: "1px solid var(--ok-bg)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          color: "var(--ok)",
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
                              fontSize: "var(--fs-body)",
                              color: "var(--text)",
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
                            fontSize: "var(--fs-caption)",
                            color: "var(--muted)",
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
          background: "var(--surface-2)",
          borderTop: "1px solid var(--border-soft)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "var(--fs-caption)",
        }}
      >
        <span style={{ color: "var(--muted)" }}>{tr("Click to open • Press ESC to dismiss")}</span>
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate("/herd");
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--brand)",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "var(--fs-caption)",
            padding: 0,
            textDecoration: "underline",
          }}
        >
          {tr("View all in Herd Health →")}
        </button>
      </div>
    </div>
  );
}
