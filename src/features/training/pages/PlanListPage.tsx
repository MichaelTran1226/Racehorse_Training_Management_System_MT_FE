import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { Select } from "@/shared/components/form/Select";
import { Tabs } from "@/shared/components/ui/Tabs";
import { Textarea } from "@/shared/components/form/Textarea";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { trainingApi } from "../api";
import type { PlanStatus, TrainingPlan } from "../types";

const STATUS_CONFIG: Record<PlanStatus, { label: string; tone: "ok" | "warn" | "danger" | "neutral" | "info" }> = {
  DRAFT: { label: "Bản nháp", tone: "neutral" },
  ACTIVE: { label: "Đang áp dụng", tone: "ok" },
  COMPLETED: { label: "Đã hoàn thành", tone: "info" },
  CANCELLED: { label: "Đã hủy", tone: "danger" },
};

export default function PlanListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isTrainer = user?.role === "HEAD_TRAINER" || user?.role === "CLUB_MANAGER";

  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Cancel Modal (DL-2.03)
  const [cancellingPlan, setCancellingPlan] = useState<TrainingPlan | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");

  // Clone Modal (DL-2.05)
  const [cloningPlan, setCloningPlan] = useState<TrainingPlan | null>(null);
  const [cloneTargetHorse, setCloneTargetHorse] = useState<string>("horse-3");

  const loadPlans = useCallback(async () => {
    try {
      const data = await trainingApi.getPlans();
      setPlans(data);
    } catch {
      toast.show("Không thể tải danh sách giáo án huấn luyện", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let ignore = false;
    trainingApi
      .getPlans()
      .then((data) => {
        if (!ignore) {
          setPlans(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          toast.show("Không thể tải danh sách giáo án huấn luyện", "danger");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [toast]);

  const handleActivate = async (plan: TrainingPlan) => {
    try {
      await trainingApi.activatePlan(plan.id);
      toast.show(`Đã kích hoạt giáo án ${plan.planCode}`, "ok");
      void loadPlans();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi kích hoạt giáo án";
      toast.show(msg, "danger");
    }
  };

  const handleComplete = async (plan: TrainingPlan) => {
    try {
      await trainingApi.completePlan(plan.id);
      toast.show(`Đã hoàn thành giáo án ${plan.planCode}`, "ok");
      void loadPlans();
    } catch {
      toast.show("Lỗi khi hoàn thành giáo án", "danger");
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingPlan || !cancelReason.trim()) return;
    try {
      await trainingApi.cancelPlan(cancellingPlan.id, cancelReason);
      toast.show(`Đã hủy giáo án ${cancellingPlan.planCode}`, "ok");
      setCancellingPlan(null);
      setCancelReason("");
      void loadPlans();
    } catch {
      toast.show("Lỗi khi hủy giáo án", "danger");
    }
  };

  const handleConfirmClone = async () => {
    if (!cloningPlan) return;
    try {
      const horseNames: Record<string, string> = {
        "horse-1": "Thần Gió (Thunderbolt)",
        "horse-2": "Bạch Mã Hoàng Tử (Silver Arrow)",
        "horse-3": "Hắc Báo (Black Panther)",
        "horse-4": "Hỏa Tiễn (Rocket)",
      };
      const cloned = await trainingApi.clonePlan(
        cloningPlan.id,
        cloneTargetHorse,
        horseNames[cloneTargetHorse] || "Ngựa đua",
      );
      toast.show(`Đã nhân bản giáo án thành công: ${cloned.planCode}`, "ok");
      setCloningPlan(null);
      void loadPlans();
    } catch {
      toast.show("Lỗi nhân bản giáo án", "danger");
    }
  };

  const filteredPlans = plans.filter((p) => {
    const matchesTab = activeTab === "ALL" ? true : p.status === activeTab;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.planCode.toLowerCase().includes(search.toLowerCase()) ||
      p.horseName.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Danh Sách Giáo Án Huấn Luyện</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Quản lý kế hoạch huấn luyện theo chu kỳ, giai đoạn bứt tốc và kiểm tra an toàn y tế
          </p>
        </div>

        {isTrainer && (
          <Button tone="primary" onClick={() => navigate("/training/plans/new")}>
            + Lập giáo án mới
          </Button>
        )}
      </div>

      {/* Tabs & Search */}
      <Card pad={16}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <Tabs
            items={[
              { id: "ALL", label: `Tất cả (${plans.length})` },
              { id: "ACTIVE", label: `Đang áp dụng (${plans.filter((p) => p.status === "ACTIVE").length})` },
              { id: "DRAFT", label: `Bản nháp (${plans.filter((p) => p.status === "DRAFT").length})` },
              { id: "COMPLETED", label: `Đã hoàn thành (${plans.filter((p) => p.status === "COMPLETED").length})` },
              { id: "CANCELLED", label: `Đã hủy (${plans.filter((p) => p.status === "CANCELLED").length})` },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />

          <Input
            placeholder="Tìm theo tên giáo án, mã, tên ngựa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
          />
        </div>
      </Card>

      {/* Plan list */}
      <Card>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Đang tải danh sách giáo án...</div>
        ) : filteredPlans.length === 0 ? (
          <EmptyState
            title="Không tìm thấy giáo án"
            description="Hiện không có giáo án nào khớp với điều kiện lọc."
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Mã giáo án</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Tên giáo án</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Ngựa áp dụng</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Thời gian</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Số giai đoạn</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Trạng thái</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{plan.planCode}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: 600 }}>{plan.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Mục tiêu: {plan.targetDistanceMeters}m · {plan.target}
                      </div>
                      {plan.isLockedByMedical && (
                        <div style={{ fontSize: "0.75rem", color: "var(--danger)", marginTop: "0.25rem", fontWeight: 600 }}>
                          🔒 Ngựa có Khóa y tế - Chặn bài tập nặng
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Link to={`/medical/horses/${plan.horseId}`} style={{ color: "var(--accent)", textDecoration: "underline" }}>
                        {plan.horseName}
                      </Link>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div>{plan.startDate}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>đến {plan.endDate}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Badge tone="neutral">{plan.phases.length} giai đoạn</Badge>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <Badge tone={STATUS_CONFIG[plan.status].tone}>{STATUS_CONFIG[plan.status].label}</Badge>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {isTrainer && plan.status === "DRAFT" && (
                          <Button tone="primary" onClick={() => void handleActivate(plan)}>
                            Kích hoạt
                          </Button>
                        )}
                        {isTrainer && plan.status === "ACTIVE" && (
                          <Button tone="accent" onClick={() => void handleComplete(plan)}>
                            Hoàn thành
                          </Button>
                        )}
                        {isTrainer && (plan.status === "DRAFT" || plan.status === "ACTIVE") && (
                          <Button tone="danger" onClick={() => setCancellingPlan(plan)}>
                            Hủy
                          </Button>
                        )}
                        {isTrainer && (
                          <Button tone="secondary" onClick={() => setCloningPlan(plan)}>
                            Nhân bản
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Cancel Modal (DL-2.03) */}
      {cancellingPlan && (
        <Modal onClose={() => setCancellingPlan(null)} title={`Hủy giáo án: ${cancellingPlan.planCode}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "0.875rem" }}>
              Bạn có chắc chắn muốn hủy giáo án <strong>{cancellingPlan.name}</strong>? Toàn bộ các buổi tập chưa diễn ra sẽ
              được chuyển sang trạng thái Đã hủy.
            </p>

            <Field label="Lý do hủy giáo án" required hint="Tối thiểu 10 ký tự">
              <Textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <Button tone="ghost" onClick={() => setCancellingPlan(null)}>
                Đóng
              </Button>
              <Button
                tone="danger"
                onClick={() => void handleConfirmCancel()}
                disabled={cancelReason.trim().length < 10}
              >
                Xác nhận hủy giáo án
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Clone Modal (DL-2.05) */}
      {cloningPlan && (
        <Modal onClose={() => setCloningPlan(null)} title={`Nhân bản giáo án: ${cloningPlan.planCode}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "0.875rem" }}>
              Hệ thống sẽ sao chép cấu trúc giai đoạn, mục tiêu thể lực và các thiết lập bài tập sang một giáo án nháp mới.
            </p>

            <Field label="Chọn ngựa áp dụng giáo án nhân bản" required>
              <Select
                value={cloneTargetHorse}
                onChange={(e) => setCloneTargetHorse(e.target.value)}
                options={[
                  { value: "horse-1", label: "Thần Gió (Thunderbolt) - EQ-001" },
                  { value: "horse-3", label: "Hắc Báo (Black Panther) - EQ-003" },
                  { value: "horse-4", label: "Hỏa Tiễn (Rocket) - EQ-004" },
                ]}
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <Button tone="ghost" onClick={() => setCloningPlan(null)}>
                Hủy
              </Button>
              <Button tone="primary" onClick={() => void handleConfirmClone()}>
                Tiến hành nhân bản
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
