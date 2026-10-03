import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { Card } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/form/Input";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { listAccounts } from "@/features/accounts/api";
import type { PublicAccount, Role } from "@/shared/types/auth";
import { ROLE_LABEL } from "@/shared/lib/permissions";
import { ACCOUNT_STATUS } from "@/shared/lib/status";
import { initials } from "@/shared/lib/format";

const STAFF_ROLES: Role[] = ["CLUB_MANAGER", "HEAD_TRAINER", "VETERINARIAN", "GROOM"];

export default function StaffDirectoryPage() {
  const currentUser = useCurrentUser();
  const [accounts, setAccounts] = useState<PublicAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");

  useEffect(() => {
    let active = true;
    listAccounts()
      .then((data) => {
        if (active) setAccounts(data.accounts);
      })
      .catch(() => {
        // Fallback gracefully
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const staffMembers = useMemo(() => {
    return accounts.filter((acc) => {
      if (!STAFF_ROLES.includes(acc.role)) return false;
      if (roleFilter !== "ALL" && acc.role !== roleFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          acc.fullName.toLowerCase().includes(q) ||
          acc.email.toLowerCase().includes(q) ||
          acc.phone.includes(q)
        );
      }
      return true;
    });
  }, [accounts, roleFilter, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="EQUINE STAFF & OPERATIONS"
        title="Staff Directory"
        description="Active operating staff, trainers, veterinarians, and grooms managing EquiFlow facilities."
        action={
          currentUser.permissions.manageAccounts ? (
            <Link to="/accounts">
              <Button tone="primary" size="md">
                + Manage Accounts & Invites
              </Button>
            </Link>
          ) : undefined
        }
      />

      <Card pad={16}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Button
              size="sm"
              tone={roleFilter === "ALL" ? "primary" : "secondary"}
              onClick={() => setRoleFilter("ALL")}
            >
              All Staff ({accounts.filter((a) => STAFF_ROLES.includes(a.role)).length})
            </Button>
            {STAFF_ROLES.map((r) => (
              <Button
                key={r}
                size="sm"
                tone={roleFilter === r ? "primary" : "secondary"}
                onClick={() => setRoleFilter(r)}
              >
                {ROLE_LABEL[r]} ({accounts.filter((a) => a.role === r).length})
              </Button>
            ))}
          </div>

          <div style={{ minWidth: 260 }}>
            <Input
              placeholder="Search staff by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          Loading staff directory...
        </div>
      ) : staffMembers.length === 0 ? (
        <Card pad={32}>
          <EmptyState
            title="No staff members found"
            description="No staff match your current filter or search criteria."
          />
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {staffMembers.map((staff) => (
            <Card key={staff.id} pad={20}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--surface-sunken, #e2e8f0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "var(--brand, #16a34a)",
                    fontSize: "1.125rem",
                    flexShrink: 0,
                  }}
                >
                  {initials(staff.fullName)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {staff.fullName}
                    </h3>
                    <Badge tone={ACCOUNT_STATUS[staff.status]?.tone || "neutral"}>
                      {ACCOUNT_STATUS[staff.status]?.label || staff.status}
                    </Badge>
                  </div>

                  <p style={{ margin: "0.25rem 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    {ROLE_LABEL[staff.role]}
                  </p>

                  <div style={{ marginTop: "0.75rem", fontSize: "0.8125rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--ink-muted, #64748b)" }}>
                      <span>✉</span>
                      <a href={`mailto:${staff.email}`} style={{ color: "inherit", textDecoration: "none" }}>
                        {staff.email}
                      </a>
                    </div>
                    {staff.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--ink-muted, #64748b)" }}>
                        <span>☎</span>
                        <span>{staff.phone}</span>
                      </div>
                    )}
                  </div>

                  {currentUser.permissions.manageAccounts && (
                    <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border, #e2e8f0)", display: "flex", gap: "0.5rem" }}>
                      <Link to={`/accounts/${staff.id}/permissions`} style={{ fontSize: "0.8125rem", color: "var(--accent, #2563eb)", textDecoration: "underline" }}>
                        View Permissions Matrix
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
