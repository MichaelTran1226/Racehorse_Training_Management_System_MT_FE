import { useState, useEffect } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { KpiTile } from "@/shared/components/ui/KpiTile";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { tr } from "@/shared/i18n/tr";
import { fetchOwnerSummary, changeInvoiceStatus, generateMonthlyInvoices } from "../api";
import type { InvoiceStatus, OwnerSummaryResponse } from "../types";

export default function OwnerFinancialReportsPage() {
  const user = useCurrentUser();
  const isClubManager = user.role === "CLUB_MANAGER";

  const [summary, setSummary] = useState<OwnerSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchOwnerSummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load financial summary", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: InvoiceStatus) {
    try {
      await changeInvoiceStatus(id, newStatus);
      setStatusMessage(tr(`Invoice status updated to ${newStatus}`));
      loadData();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || tr("Failed to update invoice status"));
    }
  }

  async function handleGenerateMonthly() {
    const period = prompt(tr("Enter billing period (YYYY-MM):"), "2026-11");
    if (!period) return;
    try {
      const res = await generateMonthlyInvoices(period);
      alert(tr(`Generated ${res.createdCount} draft statements for period ${res.billingPeriod}`));
      loadData();
    } catch (err: any) {
      alert(err?.message || tr("Failed to generate monthly invoices"));
    }
  }

  function handlePrintSnapshot() {
    window.print();
  }

  const invoices = summary?.invoices ?? [];
  const periods = Array.from(new Set(invoices.map((i) => i.billingPeriod))).sort().reverse();

  const filteredInvoices = invoices.filter((i) => {
    if (selectedPeriod === "ALL") return true;
    return i.billingPeriod === selectedPeriod;
  });

  const totalExpense = summary?.totalExpense ?? 0;
  const totalPrizeCredit = summary?.totalPrizeCredit ?? 0;
  const totalNet = summary?.totalNet ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PageHeader
        title={tr("Owner Financial Reports & Ledger Settlement")}
        description={tr(
          "Transparent accounting ledger: monthly stall boarding, veterinary care, conditioning expenses, and 70% race prize deductions.",
        )}
        action={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button tone="secondary" onClick={handlePrintSnapshot}>
              📄 {tr("Export Snapshot PDF")}
            </Button>
            {isClubManager && (
              <Button tone="primary" onClick={handleGenerateMonthly}>
                + {tr("Generate Monthly Invoices")}
              </Button>
            )}
          </div>
        }
      />

      {statusMessage && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "var(--brand-muted, rgba(16, 185, 129, 0.1))",
            color: "var(--brand, #10b981)",
            borderRadius: "var(--r-sm, 6px)",
            fontWeight: 600,
            fontSize: "var(--fs-sm)",
          }}
        >
          ✓ {statusMessage}
        </div>
      )}

      {/* KPI Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <KpiTile
          label={tr("Total Upkeep Expenses")}
          value={`${(totalExpense / 1000000).toLocaleString()}M`}
          unit="VND"
          caption={tr("Boarding, medical & conditioning fees")}
        />
        <KpiTile
          label={tr("Tournament Prize Credits")}
          value={`+${(totalPrizeCredit / 1000000).toLocaleString()}M`}
          unit="VND"
          caption={tr("70% owner purse winnings auto-credited")}
          accent={totalPrizeCredit > 0}
        />
        <KpiTile
          label={tr("Net Settlement Balance")}
          value={`${(Math.abs(totalNet) / 1000000).toLocaleString()}M`}
          unit={totalNet <= 0 ? tr("VND (Payout)") : tr("VND (Due)")}
          caption={
            totalNet <= 0
              ? tr("Club payout due to Owner (Surplus prize)")
              : tr("Outstanding upkeep balance payable")
          }
        />
        <KpiTile
          label={tr("Billing Statements")}
          value={String(invoices.length)}
          caption={tr("Archived monthly financial ledgers")}
        />
      </div>

      {/* Filter and Period Selector */}
      <Card pad={16}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <label style={{ fontWeight: 600, fontSize: "var(--fs-sm)" }}>{tr("Billing Period:")}</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "var(--r-sm, 6px)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink)",
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
              }}
            >
              <option value="ALL">{tr("All Billing Periods")}</option>
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
            <span>🏠 {tr("Stall Boarding:")} {((summary?.totalBoarding ?? 0) / 1000000).toLocaleString()}M</span>
            <span>🩺 {tr("Veterinary Care:")} {((summary?.totalMedical ?? 0) / 1000000).toLocaleString()}M</span>
            <span>🏇 {tr("Conditioning:")} {((summary?.totalTraining ?? 0) / 1000000).toLocaleString()}M</span>
          </div>
        </div>
      </Card>

      {/* Invoices List Table */}
      {loading ? (
        <Card pad={32}>
          <div style={{ textAlign: "center", color: "var(--muted)" }}>{tr("Loading financial statements...")}</div>
        </Card>
      ) : filteredInvoices.length === 0 ? (
        <Card pad={32}>
          <EmptyState
            title={tr("No Financial Statements Found")}
            description={tr("Monthly billing statements and tournament earnings credits will appear here.")}
          />
        </Card>
      ) : (
        <Card pad={20}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--fs-sm)" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left", color: "var(--muted)" }}>
                  <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Period")}</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Horse")}</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Stall Boarding")}</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Medical & Vet")}</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Conditioning")}</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Prize Credit")}</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Net Amount")}</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Status")}</th>
                  {isClubManager && <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Actions")}</th>}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const isCredit = inv.netAmount < 0;
                  return (
                    <tr key={inv.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, color: "var(--ink)" }}>
                        {inv.billingPeriod}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <strong style={{ color: "var(--ink)" }}>{inv.horse.name}</strong>
                        <span style={{ fontSize: "var(--fs-xs)", color: "var(--muted)", display: "block" }}>
                          {inv.horse.breed}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        {inv.boardingFee.toLocaleString()} đ
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        {inv.medicalFee.toLocaleString()} đ
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        {inv.trainingFee.toLocaleString()} đ
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "var(--brand, #10b981)", fontWeight: 700 }}>
                        {inv.prizeCredit > 0 ? `+${inv.prizeCredit.toLocaleString()} đ` : "—"}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem 0.5rem",
                          fontWeight: 800,
                          color: isCredit ? "var(--brand, #10b981)" : "var(--ink)",
                        }}
                      >
                        {isCredit
                          ? `${tr("Payout:")} ${Math.abs(inv.netAmount).toLocaleString()} đ`
                          : `${inv.netAmount.toLocaleString()} đ`}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <Badge
                          tone={
                            inv.status === "PAID"
                              ? "ok"
                              : inv.status === "SENT"
                              ? "warn"
                              : inv.status === "OVERDUE"
                              ? "danger"
                              : "neutral"
                          }
                        >
                          {tr(inv.status)}
                        </Badge>
                      </td>
                      {isClubManager && (
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            {inv.status === "DRAFT" && (
                              <Button
                                tone="secondary"
                                size="sm"
                                onClick={() => handleStatusChange(inv.id, "SENT")}
                              >
                                {tr("Send")}
                              </Button>
                            )}
                            {inv.status === "SENT" && (
                              <Button
                                tone="primary"
                                size="sm"
                                onClick={() => handleStatusChange(inv.id, "PAID")}
                              >
                                {tr("Mark Paid")}
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
