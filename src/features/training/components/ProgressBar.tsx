/** Thanh tiến độ "Hoàn thành / đã đến hạn" (SC-2.01, SC-2.02, SC-2.04). */
export function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div title={`${done}/${total} due workouts completed`}>
      <div style={{ height: 6, background: "var(--surface-sunken)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--brand)" }} />
      </div>
      <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 2 }}>
        {total > 0 ? `${pct}% (${done}/${total})` : "No workouts due yet"}
      </div>
    </div>
  );
}
