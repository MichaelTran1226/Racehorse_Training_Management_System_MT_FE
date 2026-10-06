import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { useToast } from "@/shared/components/ui/Toast";
import { formatDateTime } from "@/shared/lib/format";
import { messageFor } from "@/shared/lib/messages";
import { ROLE_LABEL } from "@/shared/lib/permissions";
import { listPermissionRequests, resolvePermissionRequest } from "../api";
import type { PermissionRequest } from "../types";
import styles from "./PermissionRequestsPanel.module.css";

// WorkFlow 1 §7.4: yêu cầu "Request the permission" gửi từ màn 403 hiện ở đây cho Club Manager.
// Mở màn Permissions của người gửi để bật quyền, rồi đánh dấu Granted — hoặc Dismiss nếu không cấp.
// Không có yêu cầu nào đang chờ => panel ẩn (bảng tài khoản bên dưới vẫn là nội dung chính của trang).
export function PermissionRequestsPanel() {
  const toast = useToast();
  const [requests, setRequests] = useState<PermissionRequest[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setRequests((await listPermissionRequests()).requests);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    listPermissionRequests()
      .then((res) => {
        if (!ignore) {
          setRequests(res.requests);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setFailed(true);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function resolve(request: PermissionRequest, status: "GRANTED" | "DISMISSED") {
    setBusyId(request.id);
    try {
      await resolvePermissionRequest(request.id, status);
      setRequests((list) => (list ? list.filter((r) => r.id !== request.id) : list));
      const who = request.account?.fullName ?? "The request";
      toast.show(status === "GRANTED" ? `${who}: request marked as granted.` : `${who}: request dismissed.`, status === "GRANTED" ? "ok" : "warn");
    } catch (err) {
      toast.show(messageFor(err), "danger");
    } finally {
      setBusyId(null);
    }
  }

  if (failed) {
    return (
      <div className={styles.panel}>
        <Alert
          tone="warn"
          icon="alert"
          title="Permission requests could not be loaded"
          action={
            <Button tone="secondary" size="sm" icon="refresh" onClick={load}>
              Try again
            </Button>
          }
        >
          Requests sent from the access-denied page are safe; they appear here once the service answers.
        </Alert>
      </div>
    );
  }
  if (!requests || requests.length === 0) return null;

  return (
    <Card
      pad={0}
      className={styles.panel}
      title={`Permission requests · ${requests.length}`}
      subtitle="Sent from the access-denied page. Open the permissions, switch on what the work needs, then mark it granted."
    >
      <ul className={styles.list}>
        {requests.map((r) => (
          <li key={r.id} className={styles.item}>
            <div className={styles.who}>
              <strong>{r.account?.fullName ?? "Deleted account"}</strong>
              {r.account ? ` · ${ROLE_LABEL[r.account.role]}` : ""} asks for <strong>{r.screen}</strong>
              <span className={styles.meta}>
                {formatDateTime(r.at)} · reference {r.reference}
              </span>
            </div>
            <div className={styles.actions}>
              {r.account && (
                <Link to={`/accounts/${r.account.id}/permissions`} className={styles.link}>
                  Open permissions
                </Link>
              )}
              <Button size="sm" icon="check" disabled={busyId === r.id} onClick={() => resolve(r, "GRANTED")}>
                Mark granted
              </Button>
              <Button tone="ghost" size="sm" disabled={busyId === r.id} onClick={() => resolve(r, "DISMISSED")}>
                Dismiss
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
