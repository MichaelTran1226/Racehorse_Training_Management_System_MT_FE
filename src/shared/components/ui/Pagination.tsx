import { Button } from "./Button";
import styles from "./Pagination.module.css";

interface PaginationProps {
  page: number; // bắt đầu từ 1
  pageSize: number;
  total: number;
  noun: string; // "accounts"
  onPage: (page: number) => void;
}

// Chân bảng: "Showing 1–7 of 7 accounts" + nút trang. Nút bị chặn ở trang đầu/cuối vẫn hiện, kèm lý do.
export function Pagination({ page, pageSize, total, noun, onPage }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const singular = noun.endsWith("s") ? noun.slice(0, -1) : noun;

  const summary =
    total === 0
      ? `No ${noun} match this filter`
      : total === 1
        ? `Showing 1 ${singular}`
        : `Showing ${from}–${to} of ${total} ${noun}`;

  return (
    <div className={styles.bar}>
      <span className={styles.summary}>{summary}</span>
      <nav className={styles.buttons} aria-label="Pagination">
        <Button
          tone="secondary"
          size="sm"
          icon="chevronLeft"
          aria-label="Previous page"
          blockedReason={page <= 1 ? "This is the first page." : undefined}
          onClick={() => onPage(page - 1)}
        />
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
          <Button
            key={p}
            tone={p === page ? "primary" : "secondary"}
            size="sm"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPage(p)}
          >
            {p}
          </Button>
        ))}
        <Button
          tone="secondary"
          size="sm"
          icon="chevronRight"
          aria-label="Next page"
          blockedReason={page >= pageCount ? "This is the last page." : undefined}
          onClick={() => onPage(page + 1)}
        />
      </nav>
    </div>
  );
}
