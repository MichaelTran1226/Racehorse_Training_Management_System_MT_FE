import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/ui/Icon";
import { useAppLanguage } from "@/shared/lib/language";
import styles from "./ActionItemsCard.module.css";

export interface ActionItemData {
  id: string;
  category: "ACCOUNT" | "STABLE";
  icon: string;
  iconTheme: "iconAccount" | "iconStable" | "iconHealth" | "iconTraining";
  title: string;
  subtitle: string;
  time: string;
  cta: string;
  to: string;
}

interface ActionItemsCardProps {
  pendingCount?: number;
  emptyStallsCount?: number;
  lockedCount?: number;
}

export function ActionItemsCard({
  pendingCount = 2,
  emptyStallsCount = 11,
  lockedCount = 2,
}: ActionItemsCardProps) {
  const { isVietnamese: isVi } = useAppLanguage();
  const [activeTab, setActiveTab] = useState<"ALL" | "ACCOUNT" | "STABLE">("ALL");

  const actionItems: ActionItemData[] = [
    {
      id: "act-account-1",
      category: "ACCOUNT",
      icon: "users",
      iconTheme: "iconAccount",
      title: isVi
        ? `${pendingCount} yêu cầu đăng ký chủ ngựa đang chờ duyệt`
        : `${pendingCount} owner requests pending approval`,
      subtitle: isVi
        ? "Cần xem xét và phê duyệt tài khoản mới"
        : "Requires review and account approval",
      time: "10:30",
      cta: isVi ? "Xem xét" : "Review",
      to: "/accounts",
    },
    {
      id: "act-stable-1",
      category: "STABLE",
      icon: "home",
      iconTheme: "iconStable",
      title: isVi
        ? `${emptyStallsCount} chuồng trống đã sẵn sàng`
        : `${emptyStallsCount} empty stalls ready`,
      subtitle: isVi
        ? "Có thể tiếp nhận ngựa mới vào chuồng"
        : "Ready for new horse intake into stalls",
      time: "09:15",
      cta: isVi ? "Sơ đồ chuồng" : "Stall Map",
      to: "/stables/map",
    },
    {
      id: "act-health-1",
      category: "STABLE",
      icon: "alert",
      iconTheme: "iconHealth",
      title: isVi
        ? `${lockedCount} ngựa cần kiểm tra sức khỏe`
        : `${lockedCount} horses need health review`,
      subtitle: isVi
        ? "Theo lịch khám và thẩm định lệnh khóa y tế"
        : "Due for medical lock check and examination",
      time: "08:40",
      cta: isVi ? "Xem chi tiết" : "Details",
      to: "/herd",
    },
    {
      id: "act-training-1",
      category: "STABLE",
      icon: "calendar",
      iconTheme: "iconTraining",
      title: isVi
        ? "1 lịch huấn luyện sắp diễn ra"
        : "1 upcoming workout session",
      subtitle: isVi
        ? "Buổi tập chiều nay lúc 15:00 tại đường cỏ"
        : "Afternoon turf track sprint session at 15:00",
      time: "07:20",
      cta: isVi ? "Xem lịch" : "Schedule",
      to: "/training",
    },
  ];

  // Filtering by active tab
  const filteredActions = actionItems.filter((i) => {
    if (activeTab === "ACCOUNT") return i.category === "ACCOUNT";
    if (activeTab === "STABLE") return i.category === "STABLE";
    return true;
  });

  const accountCount = pendingCount;
  const stableMetricCount = emptyStallsCount;

  return (
    <div className={styles.card}>
      {/* A. Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconBox} aria-hidden="true">
            <Icon name="clipboard" size={18} />
          </div>
          <h3 className={styles.title}>
            {isVi ? "Việc cần làm" : "Action Items"}
          </h3>
          <span className={styles.badge} aria-label={`${actionItems.length} tasks`}>
            {actionItems.length}
          </span>
        </div>

        <Link to="/audit" className={styles.viewAllLink}>
          {isVi ? "Xem tất cả →" : "View all →"}
        </Link>
      </div>

      {/* B. Segmented Tabs with baseline border */}
      <div className={styles.tabsBar} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "ALL"}
          onClick={() => setActiveTab("ALL")}
          className={`${styles.tabBtn} ${activeTab === "ALL" ? styles.tabBtnActive : ""}`}
        >
          <span>{isVi ? `Tất cả (${actionItems.length})` : `All (${actionItems.length})`}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "ACCOUNT"}
          onClick={() => setActiveTab("ACCOUNT")}
          className={`${styles.tabBtn} ${activeTab === "ACCOUNT" ? styles.tabBtnActive : ""}`}
        >
          <span>{isVi ? `Tài khoản (${accountCount})` : `Accounts (${accountCount})`}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "STABLE"}
          onClick={() => setActiveTab("STABLE")}
          className={`${styles.tabBtn} ${activeTab === "STABLE" ? styles.tabBtnActive : ""}`}
        >
          <span>{isVi ? `Chuồng trại (${stableMetricCount})` : `Stable (${stableMetricCount})`}</span>
        </button>
      </div>

      {/* C. Action Items List */}
      <div className={styles.list}>
        {filteredActions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyTitle}>
              {activeTab === "ACCOUNT"
                ? isVi
                  ? "Không có nhiệm vụ tài khoản cần xử lý"
                  : "No account tasks require attention"
                : activeTab === "STABLE"
                ? isVi
                  ? "Không có nhiệm vụ chuồng trại cần xử lý"
                  : "No stable tasks require attention"
                : isVi
                ? "Hiện tại không có việc nào cần xử lý"
                : "No pending action items"}
            </div>
            <div className={styles.emptySubtitle}>
              {isVi
                ? "Tất cả công việc đã hoàn thành hoặc chưa có yêu cầu mới phát sinh."
                : "All items have been reviewed or no new requests have been filed."}
            </div>
          </div>
        ) : (
          filteredActions.map((item) => (
            <div key={item.id} className={styles.taskCard}>
              <div className={styles.cardLeft}>
                <div
                  className={`${styles.iconCircle} ${styles[item.iconTheme]}`}
                  aria-hidden="true"
                >
                  <Icon name={item.icon} size={20} strokeWidth={1.8} />
                </div>

                <div className={styles.textGroup}>
                  <span className={styles.taskTitle}>{item.title}</span>
                  <span className={styles.taskSubtitle}>{item.subtitle}</span>
                </div>
              </div>

              <div className={styles.cardRight}>
                <span className={styles.taskTime}>{item.time}</span>
                <Link to={item.to} className={styles.actionBtn}>
                  {item.cta}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
