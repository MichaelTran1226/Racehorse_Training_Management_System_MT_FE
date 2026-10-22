import { useCallback, useEffect, useState } from "react";
import { messageFor } from "@/shared/lib/messages";

export interface Loaded<T> {
  data: T | null;
  error: string;
  loading: boolean;
  reload: () => void;
}

/** Mỗi khối trên dashboard tự tải dữ liệu: một khối lỗi không làm hỏng cả trang. */
export function useLoaded<T>(load: () => Promise<T>, enabled = true): Loaded<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(enabled);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    load()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError("");
      })
      .catch((err) => alive && setError(messageFor(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // load là hàm gọi API cố định của từng khối; chỉ tải lại khi bấm Try again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tick]);

  return { data, error, loading, reload };
}
