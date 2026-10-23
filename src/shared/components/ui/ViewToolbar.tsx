import { Icon } from "./Icon";
import { Segmented } from "./Segmented";
import { cx } from "@/shared/lib/cx";
import styles from "./ViewToolbar.module.css";
import { trNode } from "@/shared/i18n/tr";

export interface ViewTabItem {
  id: string;
  label: string;
  locked?: boolean;
  hasDropdown?: boolean;
}

export interface ViewToolbarProps {
  // Hàng 1: Danh sách các tab/view
  views: ViewTabItem[];
  activeView: string;
  onSelectView: (id: string) => void;
  onNewView?: () => void;

  // Hàng 2: Nút thao tác
  onFilterClick?: () => void;
  onGroupingClick?: () => void;
  onColumnsClick?: () => void;

  // Tùy chọn segmented view bên phải
  modes?: { id: string; label: string }[];
  activeMode?: string;
  onSelectMode?: (id: string) => void;

  className?: string;
}

/**
 * Thanh công cụ View & Filter Toolbar hiện đại chuẩn SaaS (Linear, Notion, Airtable)
 * Bao gồm tab thẻ có bo viền, nút lọc đen tuyền nổi bật và nút nhóm/cột sắc nét.
 */
export function ViewToolbar({
  views,
  activeView,
  onSelectView,
  onNewView,
  onFilterClick,
  onGroupingClick,
  onColumnsClick,
  modes,
  activeMode,
  onSelectMode,
  className,
}: ViewToolbarProps) {
  return (
    <div className={cx(styles.container, className)}>
      {/* Hàng 1: Tabs các chế độ xem */}
      <div className={styles.viewsRow} role="tablist">
        {onNewView && (
          <button type="button" onClick={onNewView} className={styles.newViewBtn}>
            <Icon name="plus" size={14} />
            <span>{trNode("New View")}</span>
          </button>
        )}

        {views.map((v) => {
          const isActive = v.id === activeView;
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectView(v.id)}
              className={cx(styles.viewTab, isActive && styles.activeViewTab)}
            >
              {v.locked && <Icon name="lock" size={13} style={{ opacity: 0.7 }} />}
              <span>{trNode(v.label)}</span>
              {v.hasDropdown !== false && <Icon name="chevronDown" size={12} style={{ opacity: 0.6 }} />}
            </button>
          );
        })}
      </div>

      {/* Hàng 2: Thanh thao tác (Filters, Grouping, Columns, Segmented Mode) */}
      <div className={styles.actionBar}>
        <div className={styles.leftActions}>
          <button type="button" onClick={onFilterClick} className={styles.filterBtn}>
            <Icon name="sliders" size={14} />
            <span>{trNode("Filters")}</span>
          </button>

          <button type="button" onClick={onGroupingClick} className={styles.outlineBtn}>
            <Icon name="cube" size={14} />
            <span>{trNode("Grouping")}</span>
          </button>
        </div>

        <div className={styles.rightActions}>
          <button type="button" onClick={onColumnsClick} className={styles.outlineBtn}>
            <Icon name="columns" size={14} />
            <span>{trNode("Columns")}</span>
          </button>

          {modes && activeMode && onSelectMode && (
            <Segmented
              items={modes}
              active={activeMode}
              onChange={onSelectMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
