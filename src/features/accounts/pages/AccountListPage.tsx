import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/shared/components/form/Input";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Alert } from "@/shared/components/ui/Alert";
import { Avatar } from "@/shared/components/ui/Avatar";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { ConfirmModal } from "@/shared/components/ui/ConfirmModal";
import { CellPrimary, DataTable } from "@/shared/components/ui/DataTable";
import type { Column } from "@/shared/components/ui/DataTable";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Pagination } from "@/shared/components/ui/Pagination";
import { Tabs } from "@/shared/components/ui/Tabs";
import { useToast } from "@/shared/components/ui/Toast";
import { formatDate, formatDateTime, formatTime } from "@/shared/lib/format";
import { messageFor } from "@/shared/lib/messages";
import { ROLE_LABEL } from "@/shared/lib/permissions";
import { getStoredHorses } from "@/shared/mock/horsesData";
import { ACCOUNT_STATUS, tabOf } from "@/shared/lib/status";
import type { AccountTab } from "@/shared/lib/status";
import type { PublicAccount, Role } from "@/shared/types/auth";
import { deleteAccount, listAccounts, resendInvite, runAccountAction } from "../api";
import type { AccountAction } from "../api";
import { CreateAccountModal } from "../components/CreateAccountModal";
import { EditAccountModal } from "../components/EditAccountModal";
import { PermissionRequestsPanel } from "../components/PermissionRequestsPanel";
import { ReasonConfirmModal } from "../components/ReasonConfirmModal";
import { RoleFilter } from "../components/RoleFilter";
import styles from "./AccountListPage.module.css";

const PAGE_SIZE = 10;

// Hộp thoại đang mở (một lúc chỉ một): sửa tài khoản, hoặc xác nhận một hành động.
type Dialog = { kind: "edit" | "decline" | "lock" | "deactivate" | "delete"; target: PublicAccount };

// Trạng thái có lý do do Club Manager ghi => hiện dưới badge ở cột Status.
const SHOW_REASON: PublicAccount["status"][] = ["LOCKED", "INACTIVE", "REJECTED"];

const EMPTY_COPY: Record<AccountTab, { title: string; description: string }> = {
  ALL: {
    title: "No accounts match this filter.",
    description: "Change the filter above, or create an account for a new member of the club.",
  },
  PENDING: { title: "No requests are waiting.", description: "New sign-up requests and invitations appear here until they are settled." },
  ACTIVE: { title: "No active accounts match this filter.", description: "Approve a pending request or unlock an account to see it here." },
  LOCKED: {
    title: "No locked accounts.",
    description: "Locked accounts appear here with the reason and the time they were locked. Nothing is locked at the moment.",
  },
};

// Design 1.9: danh sách tài khoản — duyệt yêu cầu, khóa/mở khóa, mở màn Permissions của từng tài khoản.
// Trang này KHÔNG tự kiểm vai trò: RoleGuard đã chặn ở cấp route (Club Manager mới vào được).
export default function AccountListPage() {
  const me = useCurrentUser();
  const toast = useToast();

  const [accounts, setAccounts] = useState<PublicAccount[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null); // giờ lỗi để hiện trong Alert
  const [tab, setTab] = useState<AccountTab>("ALL");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const horses = useMemo(() => getStoredHorses(), []);

  const load = useCallback(async () => {
    setAccounts(null);
    setLoadError(null);
    try {
      const res = await listAccounts();
      setAccounts(res.accounts);
    } catch {
      // 401/403 đã được xử lý chung; các lỗi còn lại hiện Alert kèm nút thử lại.
      setLoadError(formatTime(Date.now()));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const replace = (updated: PublicAccount) =>
    setAccounts((list) => (list ? list.map((a) => (a.id === updated.id ? updated : a)) : list));

  async function run(target: PublicAccount, action: AccountAction, reason?: string) {
    setBusy(true);
    try {
      const res = await runAccountAction(target.id, action, reason);
      replace(res.account);
      const name = target.fullName;
      if (action === "approve") toast.show(`Account approved. ${name} was notified by email and can sign in as ${ROLE_LABEL[target.role]}.`, "ok");
      if (action === "decline") toast.show(`Request declined. ${name} was notified by email.`, "warn");
      if (action === "lock") toast.show(`Account locked. ${name} can no longer sign in.`, "warn");
      if (action === "unlock") toast.show(`Account unlocked. ${name} can sign in again.`, "ok");
      if (action === "deactivate") toast.show(`Account deactivated. ${name} can no longer sign in; the records stay in place.`, "warn");
      if (action === "reactivate") toast.show(`Account reactivated. ${name} can sign in again.`, "ok");
    } catch (err) {
      toast.show(messageFor(err), "danger");
    } finally {
      setBusy(false);
      setDialog(null);
    }
  }

  async function onResendInvite(target: PublicAccount) {
    setBusy(true);
    try {
      await resendInvite(target.id);
      toast.show(`A new invitation code was sent to ${target.email}.`, "ok");
    } catch (err) {
      toast.show(messageFor(err), "danger");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(target: PublicAccount) {
    setBusy(true);
    try {
      await deleteAccount(target.id);
      setAccounts((list) => (list ? list.filter((a) => a.id !== target.id) : list));
      toast.show(`Account of ${target.fullName} deleted.`, "warn");
    } catch (err) {
      toast.show(messageFor(err), "danger");
    } finally {
      setBusy(false);
      setDialog(null);
    }
  }

  const activeManagers = (accounts ?? []).filter((a) => a.role === "CLUB_MANAGER" && a.status === "ACTIVE").length;

  const scoped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (accounts ?? []).filter((a) => (roleFilter === "ALL" || a.role === roleFilter) && (!q || a.fullName.toLowerCase().includes(q)));
  }, [accounts, roleFilter, search]);
  const counts = useMemo(
    () => ({
      ALL: scoped.length,
      PENDING: scoped.filter((a) => tabOf(a.status) === "PENDING").length,
      ACTIVE: scoped.filter((a) => a.status === "ACTIVE").length,
      LOCKED: scoped.filter((a) => a.status === "LOCKED").length,
    }),
    [scoped],
  );
  const rows = useMemo(() => scoped.filter((a) => tab === "ALL" || tabOf(a.status) === tab), [scoped, tab]);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const columns: Column<PublicAccount>[] = [
    {
      key: "account",
      header: "Account",
      width: 290,
      render: (r) => (
        <CellPrimary
          title={r.id === me.id ? `${r.fullName} (you)` : r.fullName}
          meta={r.email}
          avatar={<Avatar name={r.fullName} size={32} tone={r.id === me.id ? "brand" : "neutral"} />}
        />
      ),
    },
    {
      key: "role",
      header: "Role",
      width: 210,
      render: (r) => {
        const roleLabel = ROLE_LABEL[r.role];
        if (r.role === "HORSE_OWNER") {
          const owned = horses.filter(
            (h) => h.ownerId === r.id || (h.ownerName && h.ownerName.toLowerCase().includes(r.fullName.toLowerCase()))
          );
          return (
            <div>
              <div style={{ fontWeight: 600 }}>{roleLabel}</div>
              <Link
                to="/horses"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "11px",
                  color: owned.length > 0 ? "var(--brand)" : "var(--muted)",
                  fontWeight: 600,
                  marginTop: 2,
                  textDecoration: "none",
                }}
                title={owned.length > 0 ? owned.map((h) => `${h.name} (${h.code})`).join(", ") : "No horses assigned yet"}
              >
                <span>🐴</span>
                <span>{owned.length > 0 ? `${owned.length} horse${owned.length > 1 ? "s" : ""} at club` : "0 horses assigned"}</span>
              </Link>
            </div>
          );
        }
        return <span style={{ fontWeight: 500 }}>{roleLabel}</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      width: 160,
      render: (r) => {
        const s = ACCOUNT_STATUS[r.status];
        const reason = SHOW_REASON.includes(r.status) ? r.statusReason : null;
        return (
          <div className={styles.status}>
            <Badge tone={s.tone}>{s.label}</Badge>
            {reason && (
              <span className={styles.reason} title={reason}>
                {reason}
              </span>
            )}
          </div>
        );
      },
    },
    // Chỉ ở tab Pending: lúc gửi yêu cầu (tài khoản INVITED không tự gửi => hiện lúc được mời).
    ...(tab === "PENDING"
      ? [
          {
            key: "requested",
            header: "Requested",
            width: 190,
            render: (r: PublicAccount) =>
              r.status === "INVITED"
                ? `Invited ${formatDateTime(r.createdAt)}`
                : formatDateTime(r.requestedAt ?? r.createdAt),
          },
        ]
      : []),
    {
      key: "last",
      header: "Last active",
      width: 190,
      hideOnNarrow: true,
      render: (r) => (r.lastActive ? formatDateTime(r.lastActive) : r.requestedAt ? `requested ${formatDate(r.requestedAt)}` : "—"),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) => (
        <div className={styles.actions}>
          {r.status === "PENDING_APPROVAL" && (
            <>
              <Button size="sm" icon="check" disabled={busy} onClick={() => run(r, "approve")}>
                Approve
              </Button>
              <Button tone="ghost" size="sm" disabled={busy} onClick={() => setDialog({ kind: "decline", target: r })}>
                Decline
              </Button>
            </>
          )}
          {r.status === "INVITED" && (
            <Button tone="secondary" size="sm" icon="mail" disabled={busy} onClick={() => onResendInvite(r)}>
              Resend invite
            </Button>
          )}
          {r.status === "LOCKED" && (
            <Button tone="secondary" size="sm" icon="unlock" disabled={busy} onClick={() => run(r, "unlock")}>
              Unlock
            </Button>
          )}
          {r.status === "INACTIVE" && (
            <Button tone="secondary" size="sm" icon="refresh" disabled={busy} onClick={() => run(r, "reactivate")}>
              Reactivate
            </Button>
          )}
          {r.status === "ACTIVE" && r.id !== me.id && (
            <Button
              tone="secondary"
              size="sm"
              icon="lock"
              disabled={busy}
              blockedReason={
                r.role === "CLUB_MANAGER" && activeManagers <= 1
                  ? "The club must keep at least one active Club Manager."
                  : undefined
              }
              onClick={() => setDialog({ kind: "lock", target: r })}
            >
              Lock
            </Button>
          )}
          <Button tone="ghost" size="sm" icon="edit" disabled={busy} aria-label={`Edit ${r.fullName}`} onClick={() => setDialog({ kind: "edit", target: r })}>
            Edit
          </Button>
          <Link to={`/accounts/${r.id}/permissions`} className={styles.link}>
            <span style={{ fontSize: 13, marginRight: 2 }}>🛡️</span>
            Permissions
          </Link>
        </div>
      ),
    },
  ];

  const empty = (
    <EmptyState
      icon="users"
      title={EMPTY_COPY[tab].title}
      description={EMPTY_COPY[tab].description}
      action={
        tab === "ALL" ? (
          <Button size="sm" icon="plus" onClick={() => setCreateOpen(true)}>
            Create account
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <>
      <PageHeader
        eyebrow="MANAGEMENT WORKSPACE"
        title="Account Management"
        description="Manage club staff, horse owners, account approvals, and security access levels."
        showDate
      />

      {/* Trạng thái LỖI (design 1.9f): nêu giờ, khẳng định chưa đổi gì, có nút thử lại. Tab vẫn hiện. */}
      {loadError && (
        <Alert
          tone="danger"
          icon="xCircle"
          title="The account list could not be loaded"
          action={
            <Button tone="secondary" size="sm" icon="refresh" onClick={load}>
              Try again
            </Button>
          }
        >
          The account service did not answer at {loadError} · {formatDate(new Date())}. Nothing was changed. Try again, and report it to the club
          administrator if it keeps failing.
        </Alert>
      )}

      <PermissionRequestsPanel />

      <Card pad={0}>
        <div className={styles.toolbar}>
          <Tabs
            label="Account status"
            active={tab}
            onChange={(id) => {
              setTab(id);
              setPage(1);
            }}
            items={[
              { id: "ALL", label: "All", count: counts.ALL },
              { id: "PENDING", label: "Pending", count: counts.PENDING },
              { id: "ACTIVE", label: "Active", count: counts.ACTIVE },
              { id: "LOCKED", label: "Locked", count: counts.LOCKED },
            ]}
          />
          <div className={styles.tools}>
            <div className={styles.search}>
              <Input
                icon="search"
                type="search"
                placeholder="Search by name"
                aria-label="Search accounts by name"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <RoleFilter
              value={roleFilter}
              onChange={(v) => {
                setRoleFilter(v);
                setPage(1);
              }}
            />
            <Button size="sm" icon="plus" onClick={() => setCreateOpen(true)}>
              Create account
            </Button>
          </div>
        </div>

        <div className={styles.table}>
          {loadError ? (
            <EmptyState icon="refresh" title="Nothing to show yet." description="The list appears as soon as the account service answers." />
          ) : (
            <DataTable
              caption="Accounts"
              columns={columns}
              rows={visible}
              rowKey={(r) => r.id}
              loading={accounts === null}
              empty={empty}
            />
          )}
        </div>

        {!loadError && accounts !== null && (
          <Pagination page={current} pageSize={PAGE_SIZE} total={rows.length} noun="accounts" onPage={setPage} />
        )}
      </Card>

      {dialog?.kind === "edit" && (
        <EditAccountModal
          account={dialog.target}
          isSelf={dialog.target.id === me.id}
          isLastManager={dialog.target.role === "CLUB_MANAGER" && dialog.target.status === "ACTIVE" && activeManagers <= 1}
          onClose={() => setDialog(null)}
          onSaved={(account) => {
            replace(account);
            setDialog(null);
            toast.show(`Account of ${account.fullName} saved.`, "ok");
          }}
          onDeactivate={() => setDialog({ kind: "deactivate", target: dialog.target })}
          onDelete={() => setDialog({ kind: "delete", target: dialog.target })}
        />
      )}

      {dialog?.kind === "decline" && (
        <ReasonConfirmModal
          title={`Decline the request of ${dialog.target.fullName}?`}
          subtitle={`${ROLE_LABEL[dialog.target.role]} · ${dialog.target.email}`}
          tone="warn"
          confirmLabel="Decline request"
          cancelLabel="Keep waiting"
          reasonHint="Sent in the email to the applicant and shown when they try to sign in."
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={(reason) => run(dialog.target, "decline", reason)}
        >
          The account cannot be used. The applicant gets an email and may send a new request.
        </ReasonConfirmModal>
      )}

      {dialog?.kind === "lock" && (
        <ReasonConfirmModal
          title={`Lock the account of ${dialog.target.fullName}?`}
          subtitle={`${ROLE_LABEL[dialog.target.role]} · ${dialog.target.email}`}
          tone="danger"
          confirmLabel="Lock account"
          cancelLabel="Keep active"
          reasonHint="Shown in the Locked tab and on the sign-in page of this account."
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={(reason) => run(dialog.target, "lock", reason)}
        >
          Sign-in is refused from the next attempt and every open session ends at once. Records already entered by this account stay in place.
          Unlocking is possible at any time from this list.
        </ReasonConfirmModal>
      )}

      {dialog?.kind === "deactivate" && (
        <ReasonConfirmModal
          title={`Deactivate the account of ${dialog.target.fullName}?`}
          subtitle={`${ROLE_LABEL[dialog.target.role]} · ${dialog.target.email}`}
          tone="danger"
          confirmLabel="Deactivate account"
          cancelLabel="Keep the account"
          reasonHint="For example: contract ended. Shown on the sign-in page of this account."
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={(reason) => run(dialog.target, "deactivate", reason)}
        >
          Use this when the person leaves the club. Sign-in stops and every session ends; everything this account recorded stays in place.
          It can be reactivated from the All tab.
        </ReasonConfirmModal>
      )}

      {dialog?.kind === "delete" && (
        <ConfirmModal
          title={`Delete the account of ${dialog.target.fullName}?`}
          subtitle={`${ACCOUNT_STATUS[dialog.target.status].label} · ${dialog.target.email}`}
          tone="danger"
          confirmLabel="Delete account"
          cancelLabel="Keep the account"
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={() => onDelete(dialog.target)}
        >
          The account is removed for good. It was never used, so no records are lost. The email can be invited or registered again later.
        </ConfirmModal>
      )}

      {createOpen && (
        <CreateAccountModal
          onClose={() => setCreateOpen(false)}
          onCreated={(account) => {
            setAccounts((list) => (list ? [...list, account] : [account]));
            setCreateOpen(false);
            setTab("PENDING");
            setPage(1);
            toast.show(`Invitation sent to ${account.email}.`, "ok");
          }}
        />
      )}
    </>
  );
}
