import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/shared/components/layout/AuthLayout";
import { Alert } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { formatDateTime } from "@/shared/lib/format";
import { ROLE_LABEL } from "@/shared/lib/permissions";
import type { Role } from "@/shared/types/auth";
import { signupFlow } from "../flow";
import type { RegistrationResult } from "../types";
import styles from "./AuthPages.module.css";

// Design 1.3: yêu cầu đã tới Club Manager, chưa đăng nhập được cho tới khi được duyệt.
export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<RegistrationResult | null | undefined>(undefined);

  useEffect(() => {
    setData(signupFlow.get());
  }, []);

  if (data === undefined) return null;

  return (
    <AuthLayout
      title="The request is with the Club Manager."
      description="Sign-in opens as soon as the account is approved and the role is granted."
    >
      {data ? (
        <>
          <Alert tone="warn" icon="clock" title="Pending Approval">
            Sent to {data.reviewer} · Club Manager at {formatDateTime(data.requestedAt)}. Requests are usually reviewed within one working day.
          </Alert>
          <dl className={styles.summary}>
            <div>
              <dt>Full name</dt>
              <dd>{data.fullName}</dd>
            </div>
            <div>
              <dt>Club email</dt>
              <dd>{data.email}</dd>
            </div>
            <div>
              <dt>Role requested</dt>
              <dd>{ROLE_LABEL[data.role as Role] ?? data.role}</dd>
            </div>
            <div>
              <dt>Request code</dt>
              <dd className={styles.mono}>{data.requestCode}</dd>
            </div>
          </dl>
          <p className={styles.paragraph}>
            An email goes to {data.email} once the decision is made. Signing in before then shows the pending notice instead of the workspace.
          </p>
        </>
      ) : (
        <Alert tone="info" icon="info" title="No request to show">
          Send a request first, or sign in if the account already exists.
        </Alert>
      )}
      <Button tone="secondary" size="lg" block icon="arrowRight" onClick={() => navigate("/login")}>
        Back to sign in
      </Button>
      <p className={styles.foot}>
        Wrong details?{" "}
        <Link
          to="/sign-up"
          onClick={() => {
            signupFlow.clear();
          }}
        >
          Send a new request
        </Link>
      </p>
    </AuthLayout>
  );
}
