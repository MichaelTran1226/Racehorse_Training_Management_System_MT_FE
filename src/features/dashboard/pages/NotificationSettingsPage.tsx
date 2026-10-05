import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/ui/Icon";
import { Switch } from "@/shared/components/ui/Switch";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import {
  NOTIFICATION_CATEGORIES,
  getDefaultNotificationSettings,
  getStoredNotificationSettings,
  saveStoredNotificationSettings,
  subscribeNotificationSettings,
  type UserNotificationSettings,
} from "@/shared/lib/notifications";
import styles from "./NotificationSettingsPage.module.css";

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [settings, setSettings] = useState<UserNotificationSettings>(() =>
    getStoredNotificationSettings(user?.role),
  );
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const sync = () => {
      setSettings(getStoredNotificationSettings(user?.role));
    };
    return subscribeNotificationSettings(sync);
  }, [user?.role]);

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const updateCategory = (
    catId: string,
    key: "enabled" | "push" | "email" | "sms",
    val: boolean,
  ) => {
    const current = settings.categories[catId] || {
      enabled: true,
      push: true,
      email: true,
      sms: false,
    };
    const nextCategories = {
      ...settings.categories,
      [catId]: {
        ...current,
        [key]: val,
      },
    };
    const nextSettings: UserNotificationSettings = {
      ...settings,
      categories: nextCategories,
    };
    setSettings(nextSettings);
    saveStoredNotificationSettings(nextSettings);
    toast.show("Notification preference saved.", "ok");
  };

  const updateChannel = <K extends keyof UserNotificationSettings["channels"]>(
    key: K,
    val: UserNotificationSettings["channels"][K],
  ) => {
    const nextSettings: UserNotificationSettings = {
      ...settings,
      channels: {
        ...settings.channels,
        [key]: val,
      },
    };
    setSettings(nextSettings);
    saveStoredNotificationSettings(nextSettings);
    toast.show("Delivery channel settings updated.", "ok");
  };

  const handleReset = () => {
    const defaults = getDefaultNotificationSettings(user?.role);
    setSettings(defaults);
    saveStoredNotificationSettings(defaults);
    toast.show("Reset to default notification preferences.", "info");
  };

  const getCategorySummary = (catId: string) => {
    const catState = settings.categories[catId];
    if (!catState || !catState.enabled) return "Off";
    const channels: string[] = [];
    if (catState.push) channels.push("Push");
    if (catState.email) channels.push("Email");
    if (catState.sms) channels.push("SMS");
    return channels.length > 0 ? channels.join(", ") : "None";
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.topRow}>
          <Link to="/notifications" className={styles.backLink}>
            <Icon name="arrowLeft" size={14} />
            <span>Back to Notifications</span>
          </Link>
          <Button tone="ghost" size="sm" onClick={handleReset}>
            <Icon name="refresh" size={14} style={{ marginRight: 6 }} />
            Reset to defaults
          </Button>
        </div>
        <h1 className={styles.title}>Notification Settings</h1>
        <p className={styles.subtitle}>
          Select what notifications you receive and choose delivery channels (Browser Push, Email, SMS).
        </p>
      </div>

      {/* Notice Banner */}
      <div className={styles.noticeBanner}>
        <Icon name="info" size={18} style={{ color: "var(--accent, #0284c7)", marginTop: 2 }} />
        <div>
          EquiFlow may still send critical veterinary safety holds, horse emergency status updates,
          and essential security notices regardless of individual preference.
        </div>
      </div>

      {/* Section 1: What notifications you receive */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>What notifications you receive</h2>
        <div className={styles.list}>
          {NOTIFICATION_CATEGORIES.map((cat) => {
            const isOpen = !!openAccordions[cat.id];
            const catState = settings.categories[cat.id] || {
              enabled: true,
              push: true,
              email: true,
              sms: false,
            };
            const isAlwaysOn = user?.role && cat.alwaysOnFor?.includes(user.role);

            return (
              <div key={cat.id} className={styles.item}>
                <button
                  type="button"
                  className={styles.itemRow}
                  onClick={() => toggleAccordion(cat.id)}
                  aria-expanded={isOpen}
                >
                  <div className={styles.itemIcon}>
                    <Icon name={cat.icon} size={22} />
                  </div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemTitle}>
                      <span>{cat.name}</span>
                      {isAlwaysOn && (
                        <Badge tone="info">
                          Required for {user?.role}
                        </Badge>
                      )}
                    </div>
                    <p className={styles.itemSummary}>{getCategorySummary(cat.id)}</p>
                  </div>
                  <div className={`${styles.itemChevron} ${isOpen ? styles.itemChevronOpen : ""}`}>
                    <Icon name="chevronDown" size={18} />
                  </div>
                </button>

                {isOpen && (
                  <div className={styles.itemAccordion}>
                    <p className={styles.itemDesc}>{cat.description}</p>

                    <div className={styles.channelOptions}>
                      {/* Master Switch for Category */}
                      <div className={styles.channelRow}>
                        <div>
                          <span className={styles.channelLabel}>Allow notifications for this category</span>
                          <span className={styles.channelDesc}>
                            {isAlwaysOn
                              ? (cat.alwaysOnReason ?? "Always required for your current role.")
                              : "Toggle all delivery channels for this category on or off"}
                          </span>
                        </div>
                        <Switch
                          label={`Allow notifications for ${cat.name}`}
                          checked={catState.enabled}
                          disabled={Boolean(isAlwaysOn)}
                          blockedReason={isAlwaysOn ? cat.alwaysOnReason : undefined}
                          onChange={(v) => updateCategory(cat.id, "enabled", v)}
                        />
                      </div>

                      {/* Push Option */}
                      <div
                        className={styles.channelRow}
                        style={{ opacity: catState.enabled ? 1 : 0.5 }}
                      >
                        <div>
                          <span className={styles.channelLabel}>
                            <Icon name="bell" size={15} />
                            Browser & In-App Push
                          </span>
                          <span className={styles.channelDesc}>
                            Show instant alerts in the topbar bell and browser popups
                          </span>
                        </div>
                        <Switch
                          label={`Browser push for ${cat.name}`}
                          checked={catState.push && catState.enabled}
                          disabled={!catState.enabled || Boolean(isAlwaysOn)}
                          blockedReason={isAlwaysOn ? cat.alwaysOnReason : undefined}
                          onChange={(v) => updateCategory(cat.id, "push", v)}
                        />
                      </div>

                      {/* Email Option */}
                      <div
                        className={styles.channelRow}
                        style={{ opacity: catState.enabled ? 1 : 0.5 }}
                      >
                        <div>
                          <span className={styles.channelLabel}>
                            <Icon name="mail" size={15} />
                            Email Alerts
                          </span>
                          <span className={styles.channelDesc}>
                            Send notifications to your registered email address ({user?.email})
                          </span>
                        </div>
                        <Switch
                          label={`Email for ${cat.name}`}
                          checked={catState.email && catState.enabled}
                          disabled={!catState.enabled}
                          onChange={(v) => updateCategory(cat.id, "email", v)}
                        />
                      </div>

                      {/* SMS Option */}
                      <div
                        className={styles.channelRow}
                        style={{ opacity: catState.enabled ? 1 : 0.5 }}
                      >
                        <div>
                          <span className={styles.channelLabel}>
                            <Icon name="zap" size={15} />
                            SMS Messages
                          </span>
                          <span className={styles.channelDesc}>
                            Text message delivery for high-priority equine alerts
                          </span>
                        </div>
                        <Switch
                          label={`SMS for ${cat.name}`}
                          checked={catState.sms && catState.enabled}
                          disabled={!catState.enabled}
                          onChange={(v) => updateCategory(cat.id, "sms", v)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Where you receive notifications */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Where you receive notifications</h2>
        <div className={styles.list}>
          {/* Browser / In-App */}
          <div className={styles.item}>
            <button
              type="button"
              className={styles.itemRow}
              onClick={() => toggleAccordion("channel_browser")}
              aria-expanded={!!openAccordions["channel_browser"]}
            >
              <div className={styles.itemIcon}>
                <Icon name="bell" size={22} />
              </div>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>Browser</div>
                <p className={styles.itemSummary}>
                  {settings.channels.desktopPush
                    ? "Push notifications, unread badge counter, audio chime"
                    : "Muted"}
                </p>
              </div>
              <div
                className={`${styles.itemChevron} ${
                  openAccordions["channel_browser"] ? styles.itemChevronOpen : ""
                }`}
              >
                <Icon name="chevronDown" size={18} />
              </div>
            </button>

            {openAccordions["channel_browser"] && (
              <div className={styles.itemAccordion}>
                <div className={styles.channelOptions}>
                  <div className={styles.channelRow}>
                    <div>
                      <span className={styles.channelLabel}>Desktop Push Notifications</span>
                      <span className={styles.channelDesc}>
                        Receive browser desktop popups when new notifications arrive
                      </span>
                    </div>
                    <Switch
                      label="Desktop Push Notifications"
                      checked={settings.channels.desktopPush}
                      onChange={(v) => updateChannel("desktopPush", v)}
                    />
                  </div>

                  <div className={styles.channelRow}>
                    <div>
                      <span className={styles.channelLabel}>Bell Icon Badge Counter</span>
                      <span className={styles.channelDesc}>
                        Show unread count indicator on the topbar navigation bell
                      </span>
                    </div>
                    <Switch
                      label="Badge Counter"
                      checked={settings.channels.badgeCounter}
                      onChange={(v) => updateChannel("badgeCounter", v)}
                    />
                  </div>

                  <div className={styles.channelRow}>
                    <div>
                      <span className={styles.channelLabel}>Audio Chime on Alert</span>
                      <span className={styles.channelDesc}>
                        Play a subtle audio chime when a high-priority lock or medical alert arrives
                      </span>
                    </div>
                    <Switch
                      label="Audio Chime"
                      checked={settings.channels.sound}
                      onChange={(v) => updateChannel("sound", v)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Email */}
          <div className={styles.item}>
            <button
              type="button"
              className={styles.itemRow}
              onClick={() => toggleAccordion("channel_email")}
              aria-expanded={!!openAccordions["channel_email"]}
            >
              <div className={styles.itemIcon}>
                <Icon name="mail" size={22} />
              </div>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>Email</div>
                <p className={styles.itemSummary}>
                  {settings.channels.emailEnabled
                    ? `Active (${settings.channels.emailFrequency.toLowerCase().replace("_", " ")}) · ${user?.email}`
                    : "Turned off"}
                </p>
              </div>
              <div
                className={`${styles.itemChevron} ${
                  openAccordions["channel_email"] ? styles.itemChevronOpen : ""
                }`}
              >
                <Icon name="chevronDown" size={18} />
              </div>
            </button>

            {openAccordions["channel_email"] && (
              <div className={styles.itemAccordion}>
                <div className={styles.channelOptions}>
                  <div className={styles.channelRow}>
                    <div>
                      <span className={styles.channelLabel}>Allow Email Delivery</span>
                      <span className={styles.channelDesc}>
                        Send email copies of notifications to {user?.email}
                      </span>
                    </div>
                    <Switch
                      label="Email Notifications"
                      checked={settings.channels.emailEnabled}
                      onChange={(v) => updateChannel("emailEnabled", v)}
                    />
                  </div>

                  {settings.channels.emailEnabled && (
                    <div className={styles.channelRow}>
                      <div>
                        <span className={styles.channelLabel}>Email Frequency</span>
                        <span className={styles.channelDesc}>
                          Choose how often EquiFlow sends notification digests
                        </span>
                      </div>
                      <select
                        value={settings.channels.emailFrequency}
                        onChange={(e) =>
                          updateChannel(
                            "emailFrequency",
                            e.target.value as UserNotificationSettings["channels"]["emailFrequency"],
                          )
                        }
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid var(--border)",
                          background: "var(--surface)",
                          color: "var(--text)",
                          fontSize: "13px",
                        }}
                      >
                        <option value="INSTANT">Instant delivery</option>
                        <option value="DAILY_DIGEST">Daily digest (08:00 AM)</option>
                        <option value="IMPORTANT_ONLY">Important safety alerts only</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SMS */}
          <div className={styles.item}>
            <button
              type="button"
              className={styles.itemRow}
              onClick={() => toggleAccordion("channel_sms")}
              aria-expanded={!!openAccordions["channel_sms"]}
            >
              <div className={styles.itemIcon}>
                <Icon name="zap" size={22} />
              </div>
              <div className={styles.itemContent}>
                <div className={styles.itemTitle}>SMS</div>
                <p className={styles.itemSummary}>
                  {settings.channels.smsEnabled
                    ? `Enabled for ${user?.phone || "registered mobile"}`
                    : "Turned off"}
                </p>
              </div>
              <div
                className={`${styles.itemChevron} ${
                  openAccordions["channel_sms"] ? styles.itemChevronOpen : ""
                }`}
              >
                <Icon name="chevronDown" size={18} />
              </div>
            </button>

            {openAccordions["channel_sms"] && (
              <div className={styles.itemAccordion}>
                <div className={styles.channelOptions}>
                  <div className={styles.channelRow}>
                    <div>
                      <span className={styles.channelLabel}>SMS Message Alerts</span>
                      <span className={styles.channelDesc}>
                        Receive SMS text messages to {user?.phone || "your mobile phone"}
                      </span>
                    </div>
                    <Switch
                      label="SMS Delivery"
                      checked={settings.channels.smsEnabled}
                      onChange={(v) => updateChannel("smsEnabled", v)}
                    />
                  </div>

                  {settings.channels.smsEnabled && (
                    <div className={styles.channelRow}>
                      <div>
                        <span className={styles.channelLabel}>Emergency Alerts Only</span>
                        <span className={styles.channelDesc}>
                          Restrict SMS to critical clinical alerts (e.g., Colic emergencies, acute lameness)
                        </span>
                      </div>
                      <Switch
                        label="Emergency Only"
                        checked={settings.channels.smsEmergencyOnly}
                        onChange={(v) => updateChannel("smsEmergencyOnly", v)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className={styles.footerBar}>
        <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
          Preferences are saved automatically in your browser profile.
        </div>
        <Link to="/notifications">
          <Button tone="secondary" size="sm">
            View All Notifications
          </Button>
        </Link>
      </div>
    </div>
  );
}
