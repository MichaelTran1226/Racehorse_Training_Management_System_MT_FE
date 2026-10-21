import { api } from "@/shared/lib/api";

export interface SimulatorHorseRef {
  horse_id: string;
  microchip_id?: string;
  lifecycle_status?: string;
  medical_lock?: boolean;
  name?: string;
  code?: string;
}

export interface SimulatorTrackInfo {
  surface: string;
  target_distance_m: number;
  covered_distance_m: number;
  track_condition?: string;
  obstacles_cleared?: number;
  obstacles_total?: number;
}

export interface SimulatorMetrics {
  velocity_mps: number;
  heart_rate_bpm: number;
  stamina_pct: number;
  body_temp_c: number;
  stride_length_m?: number;
  stride_freq_spm?: number;
  calories_kcal?: number;
}

export interface SimulatorSessionItem {
  id: string;
  session_id: string;
  type: "WORKOUT" | "RACE";
  status: "IN_PROGRESS" | "COMPLETED" | "ABORTED_INJURY" | "DNF";
  horse_id: string;
  horse?: SimulatorHorseRef;
  track?: SimulatorTrackInfo;
  metrics?: SimulatorMetrics;
  alerts?: string[];
  summary?: any;
  updated_at?: string;
  created_at?: string;
  chartPoints?: { t: number; speedKmh: number; hr: number }[];
}

export interface SimulatorSessionsResponse {
  active: SimulatorSessionItem[];
  recent: SimulatorSessionItem[];
}

export const simulatorApi = {
  getSessions: () => api<SimulatorSessionsResponse>("GET", "/simulator/sessions"),
};
