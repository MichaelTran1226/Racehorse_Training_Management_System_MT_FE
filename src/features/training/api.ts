import type {
  ExerciseSession,
  FitnessMetricPoint,
  SessionResult,
  TrainingAlert,
  TrainingPlan,
  TrialRunSchedule,
} from "./types";

const MOCK_PLANS: TrainingPlan[] = [
  {
    id: "plan-1",
    planCode: "GA-2026-001",
    name: "Giáo án Tăng cường Sức bền - Derby Mùa Thu",
    horseId: "horse-1",
    horseName: "Thần Gió (Thunderbolt)",
    horseCode: "EQ-001",
    target: "Nâng cao sức bền cơ bắp và ổn định nhịp tim giai đoạn nước rút 2000m",
    targetDistanceMeters: 2000,
    startDate: "2026-09-15",
    endDate: "2026-10-31",
    status: "ACTIVE",
    headTrainerId: "usr-ht-1",
    headTrainerName: "Nguyễn Văn Huấn (HT)",
    notes: "Tập trung phân kỳ tập nhẹ vào đầu tuần và tăng tốc cuối tuần",
    createdAt: "2026-09-10",
    updatedAt: "2026-09-28",
    phases: [
      {
        id: "phase-1",
        phaseOrder: 1,
        name: "Giai đoạn 1: Làm quen & Tăng thể tích",
        startDate: "2026-09-15",
        endDate: "2026-09-30",
        targetHeartRateMax: 140,
        targetSpeedKmh: 35,
        focus: "Đi bộ dốc, trot đều đặn và canter cự ly dài tốc độ ổn định",
      },
      {
        id: "phase-2",
        phaseOrder: 2,
        name: "Giai đoạn 2: Tăng tốc & Nước rút",
        startDate: "2026-10-01",
        endDate: "2026-10-20",
        targetHeartRateMax: 175,
        targetSpeedKmh: 58,
        focus: "Bài tập ngắt quãng (Intervals), bứt tốc 400m cuối",
      },
      {
        id: "phase-3",
        phaseOrder: 3,
        name: "Giai đoạn 3: Giảm tải & Tinh chỉnh trước giải",
        startDate: "2026-10-21",
        endDate: "2026-10-31",
        targetHeartRateMax: 150,
        targetSpeedKmh: 45,
        focus: "Duy trì nhịp điệu, kiểm tra phản xạ cổng xuất phát",
      },
    ],
  },
  {
    id: "plan-2",
    planCode: "GA-2026-002",
    name: "Phục hồi thể lực nhẹ sau chấn thương dây chằng",
    horseId: "horse-2",
    horseName: "Bạch Mã Hoàng Tử (Silver Arrow)",
    horseCode: "EQ-002",
    target: "Phục hồi cơ đùi và gân bàn chân, kiểm soát nhịp tim dưới 120 bpm",
    targetDistanceMeters: 800,
    startDate: "2026-10-01",
    endDate: "2026-11-15",
    status: "DRAFT",
    headTrainerId: "usr-ht-1",
    headTrainerName: "Nguyễn Văn Huấn (HT)",
    isLockedByMedical: true,
    notes: "Đang bị khóa huấn luyện y tế. Không được xếp bài tập nặng (Canter, Gallop)!",
    createdAt: "2026-09-29",
    updatedAt: "2026-09-29",
    phases: [
      {
        id: "phase-2-1",
        phaseOrder: 1,
        name: "Giai đoạn Phục hồi Vận động Khớp",
        startDate: "2026-10-01",
        endDate: "2026-10-20",
        targetHeartRateMax: 110,
        targetSpeedKmh: 15,
        focus: "Đi bộ tay 30 phút/ngày và bơi hồ phục hồi",
      },
    ],
  },
];

const MOCK_SESSIONS: ExerciseSession[] = [
  {
    id: "ses-101",
    planId: "plan-1",
    planName: "Giáo án Tăng cường Sức bền - Derby Mùa Thu",
    horseId: "horse-1",
    horseName: "Thần Gió (Thunderbolt)",
    horseCode: "EQ-001",
    sessionDate: "2026-09-30",
    startTime: "06:30",
    endTime: "07:30",
    sessionType: "CANTER",
    intensity: "MODERATE",
    status: "COMPLETED",
    groomName: "Trần Văn Chăm (Groom)",
    jockeyName: "Lê Hoàng Nài (Jockey)",
    trackType: "TURF",
    lane: 2,
    targetDistanceMeters: 1600,
    notes: "Mặt sân cỏ khô ráo, gió nhẹ",
    result: {
      id: "res-1",
      sessionId: "ses-101",
      actualDistanceMeters: 1620,
      actualDurationSeconds: 154,
      avgSpeedKmh: 37.8,
      maxSpeedKmh: 48.2,
      avgHeartRate: 138,
      maxHeartRate: 162,
      recoveryHeartRate1Min: 98,
      recoveryHeartRate5Min: 62,
      performanceScore: 8.5,
      hasAbnormalSigns: false,
      alertSentToVet: false,
      headTrainerFeedback: "Ngựa giữ nhịp tốt, thở đều sau khi dừng bài tập.",
      recordedAt: "2026-09-30 07:40",
      recordedBy: "Nguyễn Văn Huấn (HT)",
    },
  },
  {
    id: "ses-102",
    planId: "plan-1",
    planName: "Giáo án Tăng cường Sức bền - Derby Mùa Thu",
    horseId: "horse-1",
    horseName: "Thần Gió (Thunderbolt)",
    horseCode: "EQ-001",
    sessionDate: "2026-10-01",
    startTime: "06:00",
    endTime: "07:15",
    sessionType: "GALLOP",
    intensity: "HEAVY",
    status: "SCHEDULED",
    groomName: "Trần Văn Chăm (Groom)",
    jockeyName: "Lê Hoàng Nài (Jockey)",
    trackType: "TURF",
    lane: 1,
    targetDistanceMeters: 1800,
    notes: "Tập trung bứt tốc 400m cuối",
  },
  {
    id: "ses-103",
    planId: "plan-2",
    planName: "Phục hồi thể lực nhẹ sau chấn thương dây chằng",
    horseId: "horse-2",
    horseName: "Bạch Mã Hoàng Tử (Silver Arrow)",
    horseCode: "EQ-002",
    sessionDate: "2026-10-01",
    startTime: "08:00",
    endTime: "08:45",
    sessionType: "CANTER",
    intensity: "HEAVY",
    status: "BLOCKED_BY_LOCK",
    blockedReason: "Khóa huấn luyện y tế hiệu lực: Viêm gân gấp chi trước. Nghiêm cấm tập nặng!",
    groomName: "Phạm Văn Dưỡng (Groom)",
    targetDistanceMeters: 1200,
    notes: "Đã tự động chặn bài tập nặng do phát hiện Khóa y tế",
  },
  {
    id: "ses-104",
    horseId: "horse-2",
    horseName: "Bạch Mã Hoàng Tử (Silver Arrow)",
    horseCode: "EQ-002",
    sessionDate: "2026-10-01",
    startTime: "16:00",
    endTime: "16:30",
    sessionType: "WALK",
    intensity: "LIGHT",
    status: "SCHEDULED",
    groomName: "Phạm Văn Dưỡng (Groom)",
    targetDistanceMeters: 600,
    notes: "Đi dạo cỏ mềm phục hồi khớp, tuân thủ phác đồ BS thú y",
  },
];

const MOCK_TRIAL_RUNS: TrialRunSchedule[] = [
  {
    id: "trial-1",
    runCode: "CT-2026-W40-01",
    runDate: "2026-10-03",
    trackType: "TURF",
    orderNumber: 1,
    distanceMeters: 1200,
    startTime: "07:00",
    status: "PENDING",
    coordinatorName: "Nguyễn Văn Huấn (HT)",
    notes: "Chạy thử xuất phát từ Barrier chuẩn bị Cúp Mùa Thu",
    horses: [
      { horseId: "horse-1", horseName: "Thần Gió (Thunderbolt)", jockeyName: "Lê Hoàng Nài", gateNumber: 1 },
      { horseId: "horse-3", horseName: "Hắc Báo (Black Panther)", jockeyName: "Đỗ Tuấn Kiệt", gateNumber: 2 },
      { horseId: "horse-4", horseName: "Hỏa Tiễn (Rocket)", jockeyName: "Vũ Tiến Đạt", gateNumber: 3 },
    ],
  },
  {
    id: "trial-2",
    runCode: "CT-2026-W40-02",
    runDate: "2026-10-03",
    trackType: "SAND",
    orderNumber: 2,
    distanceMeters: 1400,
    startTime: "07:45",
    status: "PENDING",
    coordinatorName: "Nguyễn Văn Huấn (HT)",
    notes: "Chạy mặt sân cát đánh giá thích ứng",
    horses: [
      { horseId: "horse-5", horseName: "Phi Yến", jockeyName: "Trương Minh", gateNumber: 1 },
      { horseId: "horse-6", horseName: "Đại Bàng Vàng", jockeyName: "Nguyễn Hùng", gateNumber: 2 },
    ],
  },
];

const MOCK_FITNESS_METRICS: FitnessMetricPoint[] = [
  { date: "2026-09-16", sessionName: "Trot cơ bản", avgSpeedKmh: 24, maxSpeedKmh: 32, avgHeartRate: 110, maxHeartRate: 135, recoveryScore: 88, staminaScore: 72, performanceScore: 7.0, hasAlert: false },
  { date: "2026-09-19", sessionName: "Canter 1200m", avgSpeedKmh: 32, maxSpeedKmh: 42, avgHeartRate: 125, maxHeartRate: 148, recoveryScore: 84, staminaScore: 75, performanceScore: 7.5, hasAlert: false },
  { date: "2026-09-22", sessionName: "Canter 1600m", avgSpeedKmh: 35, maxSpeedKmh: 46, avgHeartRate: 130, maxHeartRate: 154, recoveryScore: 82, staminaScore: 78, performanceScore: 8.0, hasAlert: false },
  { date: "2026-09-26", sessionName: "Intervals bứt tốc", avgSpeedKmh: 38, maxSpeedKmh: 52, avgHeartRate: 142, maxHeartRate: 170, recoveryScore: 79, staminaScore: 82, performanceScore: 8.2, hasAlert: false },
  { date: "2026-09-30", sessionName: "Canter tốc độ cao", avgSpeedKmh: 37.8, maxSpeedKmh: 48.2, avgHeartRate: 138, maxHeartRate: 162, recoveryScore: 86, staminaScore: 85, performanceScore: 8.5, hasAlert: false },
];

const MOCK_ALERTS: TrainingAlert[] = [
  {
    id: "alt-1",
    horseId: "horse-2",
    horseName: "Bạch Mã Hoàng Tử (Silver Arrow)",
    sessionId: "ses-99",
    sessionDate: "2026-09-28",
    severity: "HIGH",
    alertType: "LAMENESS_OBSERVED",
    message: "Groom báo cáo bước đi tập tễnh sau lượt Trot nhẹ, chân trước bên trái phản xạ đau.",
    reportedBy: "Phạm Văn Dưỡng (Groom)",
    createdAt: "2026-09-28 08:15",
    acknowledgedByVet: true,
    vetNotes: "Đã khám chẩn đoán viêm gân gấp nông (Desmitis). Đã đặt Khóa huấn luyện.",
  },
  {
    id: "alt-2",
    horseId: "horse-4",
    horseName: "Hỏa Tiễn (Rocket)",
    sessionId: "ses-100",
    sessionDate: "2026-09-29",
    severity: "MEDIUM",
    alertType: "HEART_RATE_SPIKE",
    message: "Nhịp tim sau tập phục hồi chậm (115 bpm sau 5 phút nghỉ).",
    reportedBy: "Lê Hoàng Nài (Jockey)",
    createdAt: "2026-09-29 07:35",
    acknowledgedByVet: false,
  },
];

export const trainingApi = {
  // Plans
  async getPlans(): Promise<TrainingPlan[]> {
    return structuredClone(MOCK_PLANS);
  },

  async getPlanById(id: string): Promise<TrainingPlan | null> {
    const p = MOCK_PLANS.find((item) => item.id === id);
    return p ? structuredClone(p) : null;
  },

  async createPlan(data: Partial<TrainingPlan>): Promise<TrainingPlan> {
    const newPlan: TrainingPlan = {
      id: `plan-${Date.now()}`,
      planCode: `GA-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: data.name || "Giáo án mới",
      horseId: data.horseId || "horse-1",
      horseName: data.horseName || "Thần Gió",
      horseCode: data.horseCode || "EQ-001",
      target: data.target || "",
      targetDistanceMeters: data.targetDistanceMeters || 1600,
      startDate: data.startDate || new Date().toISOString().split("T")[0],
      endDate: data.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: data.status || "DRAFT",
      phases: data.phases || [],
      headTrainerId: "usr-ht-1",
      headTrainerName: "Nguyễn Văn Huấn (HT)",
      notes: data.notes || "",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    MOCK_PLANS.unshift(newPlan);
    return structuredClone(newPlan);
  },

  async activatePlan(id: string): Promise<TrainingPlan> {
    const p = MOCK_PLANS.find((item) => item.id === id);
    if (!p) throw new Error("Không tìm thấy giáo án");
    if (p.isLockedByMedical) {
      throw new Error("Không thể kích hoạt giáo án: Ngựa đang bị Khóa huấn luyện y tế!");
    }
    p.status = "ACTIVE";
    p.updatedAt = new Date().toISOString().split("T")[0];
    return structuredClone(p);
  },

  async cancelPlan(id: string, reason: string): Promise<TrainingPlan> {
    const p = MOCK_PLANS.find((item) => item.id === id);
    if (!p) throw new Error("Không tìm thấy giáo án");
    p.status = "CANCELLED";
    p.cancelledReason = reason;
    p.updatedAt = new Date().toISOString().split("T")[0];
    return structuredClone(p);
  },

  async completePlan(id: string): Promise<TrainingPlan> {
    const p = MOCK_PLANS.find((item) => item.id === id);
    if (!p) throw new Error("Không tìm thấy giáo án");
    p.status = "COMPLETED";
    p.completedAt = new Date().toISOString().split("T")[0];
    p.updatedAt = new Date().toISOString().split("T")[0];
    return structuredClone(p);
  },

  async clonePlan(id: string, targetHorseId: string, targetHorseName: string): Promise<TrainingPlan> {
    const source = MOCK_PLANS.find((item) => item.id === id);
    if (!source) throw new Error("Không tìm thấy giáo án gốc");
    const cloned: TrainingPlan = {
      ...structuredClone(source),
      id: `plan-${Date.now()}`,
      planCode: `GA-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: `${source.name} (Bản sao)`,
      horseId: targetHorseId,
      horseName: targetHorseName,
      status: "DRAFT",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    MOCK_PLANS.unshift(cloned);
    return structuredClone(cloned);
  },

  // Sessions
  async getSessions(filter?: { date?: string; horseId?: string }): Promise<ExerciseSession[]> {
    let result = [...MOCK_SESSIONS];
    if (filter?.date) {
      result = result.filter((s) => s.sessionDate === filter.date);
    }
    if (filter?.horseId) {
      result = result.filter((s) => s.horseId === filter.horseId);
    }
    return structuredClone(result);
  },

  async createSession(session: Partial<ExerciseSession>): Promise<ExerciseSession> {
    const isLocked = session.horseId === "horse-2"; // Mock check
    const isHeavy = session.intensity === "HEAVY" || session.sessionType === "CANTER" || session.sessionType === "GALLOP";

    const newSession: ExerciseSession = {
      id: `ses-${Date.now()}`,
      planId: session.planId,
      horseId: session.horseId || "horse-1",
      horseName: session.horseName || "Thần Gió",
      sessionDate: session.sessionDate || new Date().toISOString().split("T")[0],
      startTime: session.startTime || "07:00",
      endTime: session.endTime || "08:00",
      sessionType: session.sessionType || "TROT",
      intensity: session.intensity || "MODERATE",
      status: isLocked && isHeavy ? "BLOCKED_BY_LOCK" : "SCHEDULED",
      blockedReason: isLocked && isHeavy ? "Ngựa có Khóa huấn luyện y tế hiệu lực. Tự động chặn bài tập nặng!" : undefined,
      groomName: session.groomName,
      jockeyName: session.jockeyName,
      trackType: session.trackType || "TURF",
      lane: session.lane || 1,
      targetDistanceMeters: session.targetDistanceMeters || 1200,
      notes: session.notes,
    };
    MOCK_SESSIONS.push(newSession);
    return structuredClone(newSession);
  },

  async restoreBlockedSession(sessionId: string): Promise<ExerciseSession> {
    const s = MOCK_SESSIONS.find((item) => item.id === sessionId);
    if (!s) throw new Error("Không tìm thấy buổi tập");
    s.status = "SCHEDULED";
    s.blockedReason = undefined;
    return structuredClone(s);
  },

  async saveSessionResult(sessionId: string, resultData: Partial<SessionResult>): Promise<SessionResult> {
    const s = MOCK_SESSIONS.find((item) => item.id === sessionId);
    if (!s) throw new Error("Không tìm thấy buổi tập");

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
      recordedBy: "Nguyễn Văn Huấn (HT)",
    };

    s.result = result;
    s.status = "COMPLETED";

    // If abnormal signs detected, trigger alert to VET
    if (result.hasAbnormalSigns) {
      MOCK_ALERTS.unshift({
        id: `alt-${Date.now()}`,
        horseId: s.horseId,
        horseName: s.horseName,
        sessionId: s.id,
        sessionDate: s.sessionDate,
        severity: "HIGH",
        alertType: "LAMENESS_OBSERVED",
        message: result.abnormalSignsDescription || "Ghi nhận dấu hiệu bất thường sau buổi tập",
        reportedBy: "Nguyễn Văn Huấn (HT)",
        createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        acknowledgedByVet: false,
      });
    }

    return structuredClone(result);
  },

  // Trial Runs
  async getTrialRuns(): Promise<TrialRunSchedule[]> {
    return structuredClone(MOCK_TRIAL_RUNS);
  },

  async createTrialRun(data: Partial<TrialRunSchedule>): Promise<TrialRunSchedule> {
    const item: TrialRunSchedule = {
      id: `trial-${Date.now()}`,
      runCode: `CT-2026-W${Math.floor(35 + Math.random() * 15)}-${Math.floor(1 + Math.random() * 9)}`,
      runDate: data.runDate || new Date().toISOString().split("T")[0],
      trackType: data.trackType || "TURF",
      orderNumber: MOCK_TRIAL_RUNS.length + 1,
      distanceMeters: data.distanceMeters || 1200,
      startTime: data.startTime || "07:00",
      status: "PENDING",
      horses: data.horses || [],
      coordinatorName: "Nguyễn Văn Huấn (HT)",
      notes: data.notes || "",
    };
    MOCK_TRIAL_RUNS.push(item);
    return structuredClone(item);
  },

  // Fitness Metrics & Alerts
  async getFitnessMetrics(horseId: string): Promise<FitnessMetricPoint[]> {
    void horseId;
    return structuredClone(MOCK_FITNESS_METRICS);
  },

  async getAlerts(): Promise<TrainingAlert[]> {
    return structuredClone(MOCK_ALERTS);
  },

  async acknowledgeAlert(alertId: string, vetNotes: string): Promise<TrainingAlert> {
    const alert = MOCK_ALERTS.find((a) => a.id === alertId);
    if (!alert) throw new Error("Không tìm thấy cảnh báo");
    alert.acknowledgedByVet = true;
    alert.vetNotes = vetNotes;
    return structuredClone(alert);
  },
};
