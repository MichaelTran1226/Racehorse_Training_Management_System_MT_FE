import { useEffect, useState } from "react";

// Đọc query string (?next=...&email=...) của trang hiện tại.
export function useQueryParams(): URLSearchParams | null {
  const [params] = useState<URLSearchParams | null>(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null,
  );
  return params;
}

// Đếm ngược tới mốc `target` (mili-giây). Trả về số ms còn lại, 0 khi đã qua.
export function useCountdown(target: number | null): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (target === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [target]);
  return target === null ? 0 : Math.max(0, target - now);
}

// Ngày hôm nay
export function useToday(): Date | null {
  const [today] = useState<Date | null>(() =>
    typeof window !== "undefined" ? new Date() : null,
  );
  return today;
}
