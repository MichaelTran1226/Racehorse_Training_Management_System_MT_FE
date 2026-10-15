import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Field } from "@/shared/components/form/Field";
import { Input } from "@/shared/components/form/Input";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { useAppLanguage } from "@/shared/lib/language";
import { messageFor } from "@/shared/lib/messages";
import { todayClub, trainingApi } from "../api";
import { SESSION_STATUS_LABEL, TRACK_LABEL } from "../types";
import type { ExerciseSession } from "../types";

import { tr } from "@/shared/i18n/tr";
function plusDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Lượt chạy thử (tab của SC-2.05): mỗi lượt là một buổi tập loại "Trial run".
 * Lên lịch ở Lịch tập; hệ thống chặn 2 lượt trên cùng mặt sân trong khung 15 phút (Q-2.04).
 */
export default function TrialRunsPage() {
  const user = useCurrentUser();
  const toast = useToast();
  const { isVietnamese, t } = useAppLanguage();
  const [from, setFrom] = useState(todayClub());
  const [to, setTo] = useState(plusDays(todayClub(), 14));
  const [trials, setTrials] = useState<ExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);

  const latestRequest = useRef(0);
  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    try {
      const data = await trainingApi.getTrialRuns({ from, to });
      if (requestId === latestRequest.current) setTrials(data);
    } catch (err) {
      if (requestId === latestRequest.current) toast.show(messageFor(err), "danger");
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [from, to, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // Nhóm theo ngày + mặt sân để điều phối.
  const groups = new Map<string, ExerciseSession[]>();
  for (const tr of trials) {
    const key = `${tr.sessionDate} · ${TRACK_LABEL[tr.trackType]}`;
    groups.set(key, [...(groups.get(key) ?? []), tr]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--fs-h1)", fontWeight: 700 }}>{t("trialRuns.title")}</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "var(--fs-body)" }}>
            {t("trialRuns.subtitle")}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/training/calendar">
            <Button tone={user.role === "HEAD_TRAINER" ? "primary" : "secondary"}>
              {user.role === "HEAD_TRAINER"
                ? (isVietnamese ? "+ Lên lịch trên lịch tuần" : tr("+ Schedule in calendar"))
                : (isVietnamese ? "← Lịch tập" : tr("← Schedule"))}
            </Button>
          </Link>
        </div>
      </div>

      <div style={{ padding: "0.85rem 1rem", borderRadius: "8px", background: "color-mix(in srgb, var(--brand) 8%, var(--surface))", border: "1px solid color-mix(in srgb, var(--brand) 25%, var(--border))", fontSize: "var(--fs-body)", lineHeight: 1.5 }}>
        {isVietnamese ? (
          <>
            💡 <strong>Hướng dẫn nghiệp vụ (Lượt chạy thử):</strong> Lượt chạy thử (Trial Run) là buổi tập tốc độ cao mô phỏng chặng đua chính thức có nài ngựa (Jockey) điều khiển trên đường đua thật. Để xếp một lượt chạy thử, Huấn luyện viên trưởng thêm bài tập loại <em>{tr("Trial run")}</em> trong <strong>Kế hoạch huấn luyện</strong> hoặc <strong>Lịch tuần</strong> kèm chỉ định Nài ngựa và tốc độ mục tiêu. Hệ thống sẽ tự động giám sát an toàn: không cho phép 2 lượt chạy thử trên cùng một mặt sân trong khung 15 phút và chặn tuyệt đối nếu ngựa có lệnh khóa y tế.
          </>
        ) : (
          <>
            💡 <strong>Business Guide (Trial Runs):</strong> {tr("Trial runs are high-speed simulation workouts with professional jockeys on active tracks, requiring designated target speeds. Head Trainers schedule trial runs in")}{" "}<strong>{tr("Training Plans")}</strong> or <strong>{tr("Weekly Calendar")}</strong> {tr("(selecting workout type")}{" "}<em>{tr("Trial run")}</em>{tr("). The system strictly enforces safety by preventing two trial runs on the same track within a 15-minute window and blocking any horse under a medical lock.")}
          </>
        )}
      </div>

      <Card pad={16}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Field label={isVietnamese ? "Từ ngày" : tr("From")}>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label={isVietnamese ? "Đến ngày" : tr("To")}>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </Card>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          {isVietnamese ? "Đang tải các lượt chạy thử..." : tr("Loading trial runs...")}
        </div>
      ) : trials.length === 0 ? (
        <EmptyState
          title={isVietnamese ? "Không có lượt chạy thử trong khoảng thời gian này" : tr("No trial runs in this period")}
          description={isVietnamese ? "Các lượt chạy thử sẽ xuất hiện tại đây ngay khi được xếp lịch." : tr("Trial runs appear here once they are scheduled.")}
        />
      ) : (
        [...groups.entries()].map(([key, rows]) => (
          <Card key={key} pad={20}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "var(--fs-body-lg)" }}>{key}</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-body)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-sunken)" }}>
                    <th style={{ padding: "0.5rem 0.75rem" }}>{isVietnamese ? "Giờ chạy" : tr("Time")}</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>{isVietnamese ? "Chiến mã" : tr("Horse")}</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>{isVietnamese ? "Nài ngựa" : tr("Jockey")}</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>{isVietnamese ? "Cự ly / Mục tiêu" : tr("Distance / target")}</th>
                    <th style={{ padding: "0.5rem 0.75rem" }}>{isVietnamese ? "Trạng thái" : tr("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.5rem 0.75rem", fontWeight: 700 }}>{row.startTime}</td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>
                        <Link to={`/horses/${row.horseId}`}>{row.horseName}</Link>
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>{row.jockeyName || (isVietnamese ? "Chưa giao" : "—")}</td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>
                        {row.targetDistanceMeters}m{row.targetSpeedKmh ? tr(` · ${row.targetSpeedKmh} km/h`) : ""}
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem" }}>
                        <Badge tone={row.status === "BLOCKED" ? "danger" : row.status === "COMPLETED" ? "ok" : "info"}>
                          {SESSION_STATUS_LABEL[row.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
