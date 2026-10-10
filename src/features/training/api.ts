import { api } from "@/shared/lib/api";
import { getStoredHorses } from "@/shared/mock/horsesData";
import {
  getStoredPlans,
  saveStoredPlans,
  getStoredWorkouts,
  saveStoredWorkouts,
  getStoredTrialRuns,
  saveStoredTrialRuns,
  getStoredAlerts,
  saveStoredAlerts,
  getStoredFitnessMetrics,
} from "@/shared/mock/trainingData";
import type {
  ExerciseSession,
  FitnessMetricPoint,
  SessionResult,
  TrainingAlert,
  TrainingPlan,
  TrialRunSchedule,
} from "./types";

export const trainingApi = {
  // Plans
  async getPlans(query?: { horseId?: string; status?: string; search?: string }): Promise<TrainingPlan[]> {
    const params = new URLSearchParams();
    if (query?.horseId) params.append("horseId", query.horseId);
    if (query?.status) params.append("status", query.status);
    if (query?.search) params.append("search", query.search);
    const qs = params.toString() ? `?${params.toString()}` : "";

    try {
      const res = await api<{ items: TrainingPlan[]; total: number } | TrainingPlan[]>("GET", `/training/plans${qs}`);
      if (res && "items" in res && Array.isArray(res.items)) {
        return res.items;
      }
      if (Array.isArray(res)) {
        return res;
      }
    } catch {
      // offline/fallback
    }

    let plans = getStoredPlans();
    if (query?.horseId) plans = plans.filter((p) => p.horseId === query.horseId);
    if (query?.status) plans = plans.filter((p) => p.status === query.status);
    return structuredClone(plans);
  },

  async getPlanById(id: string): Promise<TrainingPlan | null> {
    try {
      const res = await api<TrainingPlan>("GET", `/training/plans/${id}`);
      if (res) return res;
    } catch {
      // fallback
    }
    const plans = getStoredPlans();
    const p = plans.find((item) => item.id === id);
    return p ? structuredClone(p) : null;
  },

  async createPlan(data: Partial<TrainingPlan>): Promise<TrainingPlan> {
    try {
      const res = await api<TrainingPlan>("POST", "/training/plans", data);
      if (res) return res;
    } catch (err: any) {
      if (err.status === 400 || err.message?.includes("RULE-MED-01") || err.message?.includes("Medical Lock")) {
        throw err;
      }
    }

    // Fallback store update
    const horses = getStoredHorses();
    const horse = horses.find((h) => h.id === data.horseId);
    const isLocked = Boolean(horse?.isLocked);

    if (isLocked && data.status === "ACTIVE") {
      throw new Error(
        `Cannot activate training plan: Horse "${horse?.name}" is currently under Veterinary Medical Lock (RULE-MED-01). You may only save as Draft.`
      );
    }

    const plans = getStoredPlans();
    const newPlan: TrainingPlan = {
      id: `plan-${Date.now()}`,
      planCode: `PLAN-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: data.name || "New Training Plan",
      horseId: data.horseId || "horse-1",
      horseName: data.horseName || horse?.name || "Thunderbolt Swift",
      horseCode: data.horseCode || horse?.code || "HR-000001",
      target: data.target || "",
      targetDistanceMeters: data.targetDistanceMeters || 1600,
      startDate: data.startDate || new Date().toISOString().split("T")[0],
      endDate: data.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: data.status || "DRAFT",
      phases: data.phases || [],
      headTrainerId: "trainer-1",
      headTrainerName: "David Nguyen (Head Trainer)",
      notes: data.notes || "",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      isLockedByMedical: isLocked,
      medicalLockReason: horse?.lockReason,
    };
    plans.unshift(newPlan);
    saveStoredPlans(plans);
    return structuredClone(newPlan);
  },

  async updatePlan(id: string, data: Partial<TrainingPlan>): Promise<TrainingPlan> {
    try {
      const res = await api<TrainingPlan>("PUT", `/training/plans/${id}`, data);
      if (res) return res;
    } catch (err: any) {
      if (err.status === 400 || err.message?.includes("RULE-MED-01")) throw err;
    }

    const plans = getStoredPlans();
    const p = plans.find((item) => item.id === id);
    if (!p) throw new Error("Training plan not found");
    Object.assign(p, data, { updatedAt: new Date().toISOString().split("T")[0] });
    saveStoredPlans(plans);
    return structuredClone(p);
  },

  async activatePlan(id: string): Promise<TrainingPlan> {
    try {
      const res = await api<TrainingPlan>("PATCH", `/training/plans/${id}/status`, { status: "ACTIVE" });
      if (res) return res;
    } catch (err) {
      throw err;
    }

    const plans = getStoredPlans();
    const p = plans.find((item) => item.id === id);
    if (!p) throw new Error("Training plan not found");

    const horses = getStoredHorses();
    const horse = horses.find((h) => h.id === p.horseId);
    if (p.isLockedByMedical || horse?.isLocked) {
      throw new Error(
        `Cannot activate plan: Horse "${p.horseName}" is currently under protective Medical Lock (RULE-MED-01).`
      );
    }
    p.status = "ACTIVE";
    p.updatedAt = new Date().toISOString().split("T")[0];
    saveStoredPlans(plans);
    return structuredClone(p);
  },

  async cancelPlan(id: string, reason: string): Promise<TrainingPlan> {
    try {
      const res = await api<TrainingPlan>("PATCH", `/training/plans/${id}/status`, { status: "CANCELLED", reason });
      if (res) return res;
    } catch {}

    const plans = getStoredPlans();
    const p = plans.find((item) => item.id === id);
    if (!p) throw new Error("Training plan not found");
    p.status = "CANCELLED";
    p.cancelledReason = reason;
    p.updatedAt = new Date().toISOString().split("T")[0];
    saveStoredPlans(plans);
    return structuredClone(p);
  },

  async completePlan(id: string): Promise<TrainingPlan> {
    try {
      const res = await api<TrainingPlan>("PATCH", `/training/plans/${id}/status`, { status: "COMPLETED" });
      if (res) return res;
    } catch {}

    const plans = getStoredPlans();
    const p = plans.find((item) => item.id === id);
    if (!p) throw new Error("Training plan not found");
    p.status = "COMPLETED";
    p.completedAt = new Date().toISOString().split("T")[0];
    p.updatedAt = new Date().toISOString().split("T")[0];
    saveStoredPlans(plans);
    return structuredClone(p);
  },

  async clonePlan(id: string, targetHorseId: string, targetHorseName: string): Promise<TrainingPlan> {
    try {
      const res = await api<TrainingPlan>("POST", `/training/plans/${id}/clone`, { targetHorseId, targetHorseName });
      if (res) return res;
    } catch {}

    const plans = getStoredPlans();
    const source = plans.find((item) => item.id === id);
    if (!source) throw new Error("Original training plan not found");
    const cloned: TrainingPlan = {
      ...structuredClone(source),
      id: `plan-${Date.now()}`,
      planCode: `PLAN-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: `${source.name} (Copy)`,
      horseId: targetHorseId,
      horseName: targetHorseName,
      status: "DRAFT",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    plans.unshift(cloned);
    saveStoredPlans(plans);
    return structuredClone(cloned);
  },

  async deletePlan(id: string): Promise<void> {
    try {
      await api<{ message: string }>("DELETE", `/training/plans/${id}`);
    } catch {}
    const plans = getStoredPlans();
    const idx = plans.findIndex((p) => p.id === id);
    if (idx !== -1) {
      plans.splice(idx, 1);
      saveStoredPlans(plans);
    }
  },

  // Sessions / Workouts
  async getSessions(filter?: { date?: string; horseId?: string; planId?: string }): Promise<ExerciseSession[]> {
    const params = new URLSearchParams();
    if (filter?.date) params.append("date", filter.date);
    if (filter?.horseId) params.append("horseId", filter.horseId);
    if (filter?.planId) params.append("planId", filter.planId);
    const qs = params.toString() ? `?${params.toString()}` : "";

    try {
      const res = await api<ExerciseSession[]>("GET", `/training/workouts${qs}`);
      if (Array.isArray(res)) return res;
    } catch {}

    let result = getStoredWorkouts();
    if (filter?.date) result = result.filter((s) => s.sessionDate === filter.date);
    if (filter?.horseId) result = result.filter((s) => s.horseId === filter.horseId);
    if (filter?.planId) result = result.filter((s) => s.planId === filter.planId);
    return structuredClone(result);
  },

  async createSession(session: Partial<ExerciseSession>): Promise<ExerciseSession> {
    if (session.planId) {
      try {
        const res = await api<ExerciseSession>("POST", `/training/plans/${session.planId}/workouts`, session);
        if (res) return res;
      } catch (err) {
        throw err;
      }
    }

    const workouts = getStoredWorkouts();
    const newSession: ExerciseSession = {
      id: `ses-${Date.now()}`,
      planId: session.planId,
      horseId: session.horseId || "horse-1",
      horseName: session.horseName || "Thunderbolt Swift",
      sessionDate: session.sessionDate || new Date().toISOString().split("T")[0],
      startTime: session.startTime || "07:00",
      endTime: session.endTime || "08:00",
      sessionType: session.sessionType || "TROT",
      intensity: session.intensity || "MODERATE",
      status: session.status || "SCHEDULED",
      groomName: session.groomName,
      jockeyName: session.jockeyName,
      trackType: session.trackType || "TURF",
      lane: session.lane || 1,
      targetDistanceMeters: session.targetDistanceMeters || 1200,
      notes: session.notes,
    };
    workouts.push(newSession);
    saveStoredWorkouts(workouts);
    return structuredClone(newSession);
  },

  async restoreBlockedSession(sessionId: string): Promise<ExerciseSession> {
    try {
      const res = await api<ExerciseSession>("PATCH", `/training/workouts/${sessionId}`, { status: "SCHEDULED" });
      if (res) return res;
    } catch {}

    const workouts = getStoredWorkouts();
    const s = workouts.find((item) => item.id === sessionId);
    if (!s) throw new Error("Workout session not found");
    s.status = "SCHEDULED";
    s.blockedReason = undefined;
    saveStoredWorkouts(workouts);
    return structuredClone(s);
  },

  async saveSessionResult(sessionId: string, resultData: Partial<SessionResult>): Promise<SessionResult> {
    try {
      const res = await api<ExerciseSession>("PATCH", `/training/workouts/${sessionId}`, {
        status: "COMPLETED",
        actualTimeSeconds: resultData.actualDurationSeconds,
        heartRatePeak: resultData.maxHeartRate,
        heartRateRecovery: resultData.recoveryHeartRate1Min,
        performanceScore: resultData.performanceScore,
        trainerNotes: resultData.headTrainerFeedback,
      });
      if (res && res.result) return res.result;
    } catch {}

    const workouts = getStoredWorkouts();
    const s = workouts.find((item) => item.id === sessionId);
    if (!s) throw new Error("Workout session not found");

    const result: SessionResult = {
      id: `res-${Date.now()}`,
      sessionId,
      actualDistanceMeters: resultData.actualDistanceMeters || 1200,
      actualDurationSeconds: resultData.actualDurationSeconds || 120,
      avgSpeedKmh: resultData.avgSpeedKmh || 36,
      maxSpeedKmh: resultData.maxSpeedKmh || 45,
      avgHeartRate: resultData.avgHeartRate || 130,
      maxHeartRate: resultData.maxHeartRate || 155,
      recoveryHeartRate1Min: resultData.recoveryHeartRate1Min,
      recoveryHeartRate5Min: resultData.recoveryHeartRate5Min,
      performanceScore: resultData.performanceScore || 8,
      hasAbnormalSigns: Boolean(resultData.hasAbnormalSigns),
      abnormalSignsDescription: resultData.abnormalSignsDescription,
      alertSentToVet: Boolean(resultData.hasAbnormalSigns),
      headTrainerFeedback: resultData.headTrainerFeedback,
      recordedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      recordedBy: "David Nguyen (Head Trainer)",
    };

    s.result = result;
    s.status = "COMPLETED";
    saveStoredWorkouts(workouts);

    if (result.hasAbnormalSigns) {
      const alerts = getStoredAlerts();
      alerts.unshift({
        id: `alt-${Date.now()}`,
        horseId: s.horseId,
        horseName: s.horseName,
        sessionId: s.id,
        sessionDate: s.sessionDate,
        severity: "HIGH",
        alertType: "LAMENESS_OBSERVED",
        message: result.abnormalSignsDescription || "Abnormal clinical symptoms observed post-workout",
        reportedBy: "David Nguyen (Head Trainer)",
        createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        acknowledgedByVet: false,
      });
      saveStoredAlerts(alerts);
    }

    return structuredClone(result);
  },

  // Trial Runs
  async getTrialRuns(): Promise<TrialRunSchedule[]> {
    try {
      const res = await api<TrialRunSchedule[]>("GET", "/training/trial-runs");
      if (Array.isArray(res)) return res;
    } catch {}
    return structuredClone(getStoredTrialRuns());
  },

  async createTrialRun(data: Partial<TrialRunSchedule>): Promise<TrialRunSchedule> {
    try {
      const res = await api<TrialRunSchedule>("POST", "/training/trial-runs", data);
      if (res) return res;
    } catch {}

    const trials = getStoredTrialRuns();
    const item: TrialRunSchedule = {
      id: `trial-${Date.now()}`,
      runCode: `TR-2026-W${Math.floor(35 + Math.random() * 15)}-${Math.floor(1 + Math.random() * 9)}`,
      runDate: data.runDate || new Date().toISOString().split("T")[0],
      trackType: data.trackType || "TURF",
      orderNumber: trials.length + 1,
      distanceMeters: data.distanceMeters || 1200,
      startTime: data.startTime || "07:00",
      status: "PENDING",
      horses: data.horses || [],
      coordinatorName: "David Nguyen (Head Trainer)",
      notes: data.notes || "",
    };
    trials.push(item);
    saveStoredTrialRuns(trials);
    return structuredClone(item);
  },

  // Fitness Metrics & Alerts
  async getFitnessMetrics(horseId: string): Promise<FitnessMetricPoint[]> {
    try {
      const res = await api<FitnessMetricPoint[]>("GET", `/training/horses/${horseId}/fitness-metrics`);
      if (Array.isArray(res)) return res;
    } catch {}
    return structuredClone(getStoredFitnessMetrics(horseId));
  },

  async getAlerts(): Promise<TrainingAlert[]> {
    try {
      const res = await api<TrainingAlert[]>("GET", "/training/alerts");
      if (Array.isArray(res)) return res;
    } catch {}
    return structuredClone(getStoredAlerts());
  },

  async acknowledgeAlert(alertId: string, vetNotes: string): Promise<TrainingAlert> {
    try {
      const res = await api<TrainingAlert>("PATCH", `/training/alerts/${alertId}`, { vetNotes });
      if (res) return res;
    } catch {}

    const alerts = getStoredAlerts();
    const alert = alerts.find((a) => a.id === alertId);
    if (!alert) throw new Error("Training alert not found");
    alert.acknowledgedByVet = true;
    alert.vetNotes = vetNotes;
    saveStoredAlerts(alerts);
    return structuredClone(alert);
  },
};
