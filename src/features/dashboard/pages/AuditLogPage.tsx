import { useEffect, useState } from "react";
import { Input } from "@/shared/components/form/Input";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Alert } from "@/shared/components/ui/Alert";
import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { DataTable, type Column } from "@/shared/components/ui/DataTable";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Modal } from "@/shared/components/ui/Modal";
import { api } from "@/shared/lib/api";
import { formatDateTime } from "@/shared/lib/format";
import styles from "./AuditLogPage.module.css";

interface AuditLog {
  id: string; userId: string | null; action: string; entityName: string; entityId: string | null;
  oldValuesJson: string | null; newValuesJson: string | null; ipAddress: string | null;
  userAgent: string | null; timestamp: string; user: { id: string; fullName: string } | null;
}
interface Result { logs: AuditLog[]; total: number; page: number; pageSize: number }
const emptyFilters = { actor: "", action: "", from: "", to: "" };
function pretty(value: string | null) {
  if (!value) return "Not recorded";
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
}

export default function AuditLogPage() {
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const requestKey = JSON.stringify([filters, page, retry]);
  const [response, setResponse] = useState<{ key: string; result: Result | null; error: boolean } | null>(null);
  const result = response && response.key === requestKey ? response.result : null;
  const error = response?.key === requestKey && response?.error;
  const [detail, setDetail] = useState<AuditLog | null>(null);
  const invalidDates = Boolean(draft.from && draft.to && draft.from > draft.to);
  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (filters.actor.trim()) query.set("actor", filters.actor.trim());
    if (filters.action.trim()) query.set("action", filters.action.trim());
    if (filters.from) query.set("from", new Date(filters.from).toISOString());
    if (filters.to) query.set("to", new Date(filters.to).toISOString());
    api<Result>("GET", `/audit-logs?${query}`).then(data => {
      if (active) setResponse({ key: requestKey, result: data, error: false });
    }).catch(() => { if (active) setResponse({ key: requestKey, result: null, error: true }); });
    return () => { active = false; };
  }, [filters, page, requestKey]);
  const columns: Column<AuditLog>[] = [
    { key: "time", header: "Time", render: row => formatDateTime(row.timestamp) },
    { key: "actor", header: "Actor", render: row => row.user?.fullName ?? row.userId ?? "System / unavailable" },
    { key: "action", header: "Action", render: row => <span className={styles.wrap}>{row.action}</span> },
    { key: "entity", header: "Entity", render: row => <span className={styles.wrap}>{row.entityName}{row.entityId ? ` · ${row.entityId}` : ""}</span> },
    { key: "detail", header: "Details", align: "right", render: row => <Button tone="ghost" size="sm" onClick={() => setDetail(row)} aria-label={`View details for ${row.action}`}>View details</Button> },
  ];
  return <>
    <PageHeader eyebrow="MANAGEMENT WORKSPACE" title="Audit Log" description="Review recorded activity and changes. Times and date filters use your local timezone." showDate />
    {import.meta.env.VITE_USE_MOCK === "true" && <Alert tone="info" title="Demo audit history">Only activity recorded in this browser is shown (up to 200 events). Historical before/after values and request metadata are not recorded in demo mode.</Alert>}
    <Card pad={0}>
      <form className={styles.filters} onSubmit={event => { event.preventDefault(); if (!invalidDates) { setFilters({ ...draft }); setPage(1); } }}>
        <label>Actor<Input value={draft.actor} maxLength={200} onChange={e => setDraft({ ...draft, actor: e.target.value })} placeholder="Search actor name" /></label>
        <label>Action<Input value={draft.action} maxLength={100} onChange={e => setDraft({ ...draft, action: e.target.value })} placeholder="Exact action, e.g. AUTH_LOGIN" /></label>
        <label>From<Input type="datetime-local" value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })} /></label>
        <label>To<Input type="datetime-local" value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })} /></label>
        <div className={styles.actions}><Button type="submit" disabled={invalidDates}>Apply filters</Button><Button tone="secondary" type="button" onClick={() => { setDraft(emptyFilters); setFilters(emptyFilters); setPage(1); }}>Reset</Button></div>
        {invalidDates && <p role="alert">The end date must be on or after the start date.</p>}
      </form>
      {error ? <Alert tone="danger" title="Audit history could not be loaded" action={<Button tone="secondary" onClick={() => setRetry(n => n + 1)}>Try again</Button>}>Check your connection and try again.</Alert> : <div className={styles.table}><DataTable columns={columns} rows={result?.logs ?? []} rowKey={row => row.id} loading={!result} caption="Audit history, newest first" empty={<EmptyState title="No audit events match these filters." description="Adjust the actor, action or date range to see recorded activity." />} /></div>}
      {result && <div className={styles.pagination}><span role="status">{result.total} events · Page {result.page} of {Math.max(1, Math.ceil(result.total / result.pageSize))}</span><div className={styles.actions}><Button tone="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous page</Button><Button tone="secondary" disabled={page * result.pageSize >= result.total} onClick={() => setPage(page + 1)}>Next page</Button></div></div>}
    </Card>
    {detail && <Modal title="Audit event details" subtitle={`${detail.action} · ${formatDateTime(detail.timestamp)}`} width={760} onClose={() => setDetail(null)}>
      <dl className={styles.metadata}>{Object.entries({ Actor: detail.user?.fullName ?? detail.userId ?? "System / unavailable", Entity: detail.entityName, "Entity ID": detail.entityId, "Event ID": detail.id, "IP address": detail.ipAddress, "User agent": detail.userAgent }).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value ?? "Not recorded"}</dd></div>)}</dl>
      <div className={styles.values}><section><h3>Before</h3><pre>{pretty(detail.oldValuesJson)}</pre></section><section><h3>After</h3><pre>{pretty(detail.newValuesJson)}</pre></section></div>
    </Modal>}
  </>;
}
