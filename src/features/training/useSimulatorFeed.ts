import { useEffect, useState, useSyncExternalStore } from "react";
import {
  simulatorApi,
  type SimulatorSessionItem,
} from "./simulatorApi";
import {
  getSocketConnectionState,
  getSocketConnectionError,
  subscribeSocketState,
  subscribeSimulatorEvent,
  ensureSocketConnected,
  type SocketConnectionState,
} from "./simulatorSocket";

const MAX_RECENT_SESSIONS = 20;
const MAX_CHART_POINTS = 120;

export interface SimulatorFeedState {
  active: SimulatorSessionItem[];
  recent: SimulatorSessionItem[];
  loading: boolean;
  error: string | null;
  connectionState: SocketConnectionState;
  connectionError: string | null;
}

export function useSimulatorFeed(): SimulatorFeedState {
  const [active, setActive] = useState<SimulatorSessionItem[]>([]);
  const [recent, setRecent] = useState<SimulatorSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const connectionState = useSyncExternalStore(subscribeSocketState, getSocketConnectionState);
  const connectionError = getSocketConnectionError();

  // 1. Initial REST fetch of active & recent sessions
  useEffect(() => {
    let mounted = true;

    simulatorApi
      .getSessions()
      .then((res) => {
        if (!mounted) return;
        setActive(res?.active || []);
        setRecent((res?.recent || []).slice(0, MAX_RECENT_SESSIONS));
      })
      .catch((err: any) => {
        if (!mounted) return;
        setError(err.message || "Could not load simulator sessions.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    ensureSocketConnected();

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Subscribe to realtime Socket.IO packets
  useEffect(() => {
    const unsubTick = subscribeSimulatorEvent("sim:telemetry_tick", (packet: any) => {
      if (!packet || !packet.session_id) return;

      setActive((prev) => {
        const idx = prev.findIndex((s) => s.session_id === packet.session_id);
        const existing = idx >= 0 ? prev[idx] : null;

        const newChartPoint = {
          t: packet.sim_time_s ?? Date.now() / 1000,
          speedKmh: Math.round((packet.metrics?.velocity_mps ?? 0) * 3.6 * 10) / 10,
          hr: Math.round(packet.metrics?.heart_rate_bpm ?? 0),
        };

        const chartPoints = [...(existing?.chartPoints || []), newChartPoint].slice(-MAX_CHART_POINTS);

        const updated: SimulatorSessionItem = {
          id: existing?.id || packet.session_id,
          session_id: packet.session_id,
          type: existing?.type || "WORKOUT",
          status: "IN_PROGRESS",
          horse_id: packet.horse?.horse_id || existing?.horse_id || "",
          horse: {
            ...existing?.horse,
            ...packet.horse,
          },
          track: {
            ...existing?.track,
            ...packet.track,
          },
          metrics: {
            ...existing?.metrics,
            ...packet.metrics,
          },
          alerts: packet.alerts || existing?.alerts || [],
          updated_at: new Date(packet.timestamp_ms || Date.now()).toISOString(),
          chartPoints,
        };

        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    });

    const unsubProgress = subscribeSimulatorEvent("sim:race_progress", (packet: any) => {
      if (!packet || !packet.session_id) return;

      setActive((prev) => {
        const idx = prev.findIndex((s) => s.session_id === packet.session_id);
        const existing = idx >= 0 ? prev[idx] : null;

        const leader = packet.positions?.[0];
        const updated: SimulatorSessionItem = {
          id: existing?.id || packet.session_id,
          session_id: packet.session_id,
          type: "RACE",
          status: "IN_PROGRESS",
          horse_id: leader?.horse_id || existing?.horse_id || "",
          horse: existing?.horse,
          track: {
            surface: existing?.track?.surface || "TURF",
            target_distance_m: existing?.track?.target_distance_m || 1600,
            covered_distance_m: leader?.covered_distance_m || 0,
            track_condition: existing?.track?.track_condition || "GOOD",
          },
          metrics: leader
            ? {
                velocity_mps: leader.velocity_mps || 0,
                heart_rate_bpm: leader.heart_rate_bpm || 0,
                stamina_pct: existing?.metrics?.stamina_pct || 100,
                body_temp_c: existing?.metrics?.body_temp_c || 38.5,
              }
            : existing?.metrics,
          alerts: existing?.alerts || [],
          updated_at: new Date().toISOString(),
          summary: { positions: packet.positions },
        };

        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
    });

    const unsubFinished = subscribeSimulatorEvent("sim:session_finished", (packet: any) => {
      if (!packet || !packet.session_id) return;

      // 1. Remove from active
      let finishedItem: SimulatorSessionItem | null = null;
      setActive((prev) => {
        const found = prev.find((s) => s.session_id === packet.session_id);
        if (found) {
          finishedItem = {
            ...found,
            status: packet.status || "COMPLETED",
            summary: packet.result || packet.results || found.summary,
            updated_at: new Date().toISOString(),
          };
        }
        return prev.filter((s) => s.session_id !== packet.session_id);
      });

      // 2. Prepend to recent
      setRecent((prev) => {
        const base: SimulatorSessionItem = finishedItem || {
          id: packet.session_id,
          session_id: packet.session_id,
          type: packet.type || "WORKOUT",
          status: packet.status || "COMPLETED",
          horse_id: packet.horse?.horse_id || "",
          horse: packet.horse,
          summary: packet.result || packet.results,
          updated_at: new Date().toISOString(),
        };

        const filtered = prev.filter((s) => s.session_id !== packet.session_id);
        return [base, ...filtered].slice(0, MAX_RECENT_SESSIONS);
      });
    });

    return () => {
      unsubTick();
      unsubProgress();
      unsubFinished();
    };
  }, []);

  return {
    active,
    recent,
    loading,
    error,
    connectionState,
    connectionError,
  };
}
