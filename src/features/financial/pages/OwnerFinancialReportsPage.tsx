import { useState, useEffect } from "react";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { KpiTile } from "@/shared/components/ui/KpiTile";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { useCurrentUser } from "@/shared/components/layout/AuthProvider";
import { tr } from "@/shared/i18n/tr";
import { useAppLanguage } from "@/shared/lib/language";
import { fetchOwnerSummary, changeInvoiceStatus, generateMonthlyInvoices, payInvoice } from "../api";
import type { FinancialInvoice, InvoiceStatus, OwnerSummaryResponse } from "../types";

export default function OwnerFinancialReportsPage() {
  useAppLanguage();
  const user = useCurrentUser();
  const isClubManager = user.role === "CLUB_MANAGER";

  const [summary, setSummary] = useState<OwnerSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Generate monthly invoices modal state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [billingPeriodInput, setBillingPeriodInput] = useState("2026-11");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Horse owner payment modal state
  const [payingInvoice, setPayingInvoice] = useState<FinancialInvoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"VIETQR" | "CARD" | "BALANCE">("VIETQR");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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

  function handleOpenGenerate() {
    setGenerateError(null);
    setIsGenerateOpen(true);
  }

  async function handleConfirmGenerate() {
    if (!billingPeriodInput.match(/^\d{4}-\d{2}$/)) {
      setGenerateError(tr("Please enter a valid billing period in YYYY-MM format (e.g. 2026-11)"));
      return;
    }
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await generateMonthlyInvoices(billingPeriodInput);
      setStatusMessage(
        tr(`Generated ${res.createdCount} draft statements for period ${res.billingPeriod}`),
      );
      setIsGenerateOpen(false);
      loadData();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setGenerateError(err?.message || tr("Failed to generate monthly invoices"));
    } finally {
      setGenerating(false);
    }
  }

  function handlePrintSnapshot() {
    window.print();
  }

  function handleOpenPayment(invoice: FinancialInvoice) {
    setPayingInvoice(invoice);
    setPaymentSuccess(false);
    setPaymentMethod("VIETQR");
  }

  async function handleExecutePayment() {
    if (!payingInvoice) return;
    setProcessingPayment(true);
    try {
      await payInvoice(payingInvoice.id, {
        paymentMethod,
        transactionRef: "TXN-" + Date.now().toString().slice(-6),
      });
      setPaymentSuccess(true);
      setStatusMessage(
        tr(`Payment confirmed for invoice ${payingInvoice.billingPeriod} (${payingInvoice.horse.name})`),
      );
      setTimeout(() => {
        setPayingInvoice(null);
        setPaymentSuccess(false);
        loadData();
      }, 1500);
    } catch (err: any) {
      alert(err?.message || tr("Payment failed. Please try again."));
    } finally {
      setProcessingPayment(false);
    }
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
        title={tr("Owner Financial Reports")}
        description={tr(
          "Monthly statements for boarding, veterinary care, training fees, and prize deductions.",
        )}
        action={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button tone="secondary" onClick={handlePrintSnapshot}>
              📄 {tr("Export Snapshot PDF")}
            </Button>
            {isClubManager && (
              <Button tone="primary" onClick={handleOpenGenerate}>
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

      {/* Ledger Settlement Calculation Guide */}
      <Card pad={16}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, color: "var(--ink)", fontSize: "var(--fs-sm)" }}>
            <span>💡</span>
            <span>{tr("How Monthly Settlement & Prize Credits Work")}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem", fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
            <div style={{ padding: "0.625rem 0.875rem", background: "var(--surface-sunken, #f8fafc)", borderRadius: "var(--r-sm, 6px)", border: "1px solid var(--border)" }}>
              <strong style={{ color: "var(--ink)", display: "block", marginBottom: "0.25rem" }}>
                1. {tr("Total Upkeep Expenses")}
              </strong>
              {tr("Sum of monthly Stall Boarding, Vet & Medical exams, and conditioning services for each horse.")}
            </div>
            <div style={{ padding: "0.625rem 0.875rem", background: "var(--surface-sunken, #f8fafc)", borderRadius: "var(--r-sm, 6px)", border: "1px solid var(--border)" }}>
              <strong style={{ color: "var(--brand, #10b981)", display: "block", marginBottom: "0.25rem" }}>
                2. {tr("Tournament Prize Credits (70%)")}
              </strong>
              {tr("70% of prize money won by your horses is automatically deducted directly from upkeep costs.")}
            </div>
            <div style={{ padding: "0.625rem 0.875rem", background: "var(--surface-sunken, #f8fafc)", borderRadius: "var(--r-sm, 6px)", border: "1px solid var(--border)" }}>
              <strong style={{ color: "var(--ink)", display: "block", marginBottom: "0.25rem" }}>
                3. {tr("Net Settlement Balance")}
              </strong>
              {tr("Expenses minus Prize Credits. If positive, owner pays the balance. If negative, club pays surplus to owner.")}
            </div>
          </div>
        </div>
      </Card>

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
                  <th style={{ padding: "0.75rem 0.5rem" }}>{tr("Actions")}</th>
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
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", flexWrap: "wrap" }}>
                          {isClubManager && inv.status === "DRAFT" && (
                            <Button
                              tone="secondary"
                              size="sm"
                              onClick={() => handleStatusChange(inv.id, "SENT")}
                            >
                              {tr("Send")}
                            </Button>
                          )}
                          {isClubManager && inv.status === "SENT" && (
                            <Button
                              tone="secondary"
                              size="sm"
                              onClick={() => handleStatusChange(inv.id, "PAID")}
                            >
                              {tr("Mark Paid")}
                            </Button>
                          )}
                          {(inv.status === "SENT" || inv.status === "OVERDUE") && inv.netAmount > 0 && (
                            <Button
                              tone="primary"
                              size="sm"
                              onClick={() => handleOpenPayment(inv)}
                            >
                              💳 {tr("Pay Now")}
                            </Button>
                          )}
                          {(inv.status === "SENT" || inv.status === "OVERDUE") && inv.netAmount <= 0 && (
                            <span style={{ fontSize: "var(--fs-xs)", color: "var(--brand, #10b981)", fontWeight: 600 }}>
                              {tr("Payout Pending")}
                            </span>
                          )}
                          {inv.status === "PAID" && (
                            <span style={{ fontSize: "var(--fs-xs)", color: "var(--brand, #10b981)", fontWeight: 600 }}>
                              ✓ {tr("Settled")}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Generate Monthly Invoices Modal */}
      {isGenerateOpen && (
        <Modal
          title={tr("Generate Monthly Invoices & Statements")}
          subtitle={tr("Automatically compute Boarding, Medical, Training fees and deduct 70% race prizes")}
          width={540}
          onClose={() => !generating && setIsGenerateOpen(false)}
          foot={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", width: "100%" }}>
              <Button tone="secondary" onClick={() => setIsGenerateOpen(false)} disabled={generating}>
                {tr("Cancel")}
              </Button>
              <Button tone="primary" onClick={handleConfirmGenerate} disabled={generating}>
                {generating ? tr("Generating...") : tr("Generate Draft Invoices")}
              </Button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {generateError && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  background: "var(--danger-bg, #fef2f2)",
                  color: "var(--danger, #dc2626)",
                  borderRadius: "var(--r-sm, 6px)",
                  fontSize: "var(--fs-sm)",
                  border: "1px solid var(--danger-border, #fecaca)",
                }}
              >
                {generateError}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: "0.375rem" }}>
                {tr("Billing Period (YYYY-MM)")} *
              </label>
              <input
                type="month"
                value={billingPeriodInput}
                onChange={(e) => setBillingPeriodInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  borderRadius: "var(--r-sm, 6px)",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--ink)",
                  fontSize: "var(--fs-body)",
                }}
              />
              <p style={{ margin: "0.375rem 0 0", fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
                {tr("Draft invoices will be created for all active horses in the club for this period.")}
              </p>
            </div>

            {/* Parameter & Ledger Explanation */}
            <div
              style={{
                padding: "0.875rem 1rem",
                background: "var(--surface-sunken, #f8fafc)",
                borderRadius: "var(--r-sm, 6px)",
                border: "1px solid var(--border)",
                fontSize: "var(--fs-xs)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <strong style={{ color: "var(--ink)", fontSize: "var(--fs-sm)" }}>
                📋 {tr("Monthly Statement Calculation Rule:")}
              </strong>
              <div>
                • <strong>{tr("Total Upkeep Expenses:")}</strong> {tr("Includes base stall boarding (6,000,000 đ/mo), conditioning care (4,000,000 đ/mo), plus all logged veterinary exams & medicine.")}
              </div>
              <div>
                • <strong>{tr("Tournament Prize Credits:")}</strong> {tr("70% of race winnings won by the horse in this period are credited back to the owner.")}
              </div>
              <div>
                • <strong>{tr("Net Settlement Balance:")}</strong> {tr("Upkeep Expenses minus Prize Credits. Generates a clear payable statement for the horse owner.")}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Horse Owner Online Payment Modal */}
      {payingInvoice && (
        <Modal
          title={tr("Online Statement Payment")}
          subtitle={tr("Period {{period}} — Horse: {{horse}}", {
            period: payingInvoice.billingPeriod,
            horse: payingInvoice.horse.name,
          })}
          width={580}
          onClose={() => !processingPayment && setPayingInvoice(null)}
          foot={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", width: "100%" }}>
              <Button tone="secondary" onClick={() => setPayingInvoice(null)} disabled={processingPayment}>
                {tr("Cancel")}
              </Button>
              <Button tone="primary" onClick={handleExecutePayment} disabled={processingPayment || paymentSuccess}>
                {processingPayment
                  ? tr("Processing Payment...")
                  : paymentSuccess
                  ? "✓ " + tr("Paid Successfully")
                  : "✓ " + tr("Confirm Payment ({{amount}} đ)", { amount: payingInvoice.netAmount.toLocaleString() })}
              </Button>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {paymentSuccess && (
              <div
                style={{
                  padding: "0.875rem 1rem",
                  background: "var(--brand-muted, rgba(16, 185, 129, 0.15))",
                  color: "var(--brand, #10b981)",
                  borderRadius: "var(--r-sm, 6px)",
                  fontWeight: 700,
                  fontSize: "var(--fs-sm)",
                  border: "1px solid var(--brand, #10b981)",
                }}
              >
                🎉 {tr("Payment confirmed successfully! Invoice marked as PAID.")}
              </div>
            )}

            {/* Bill Summary */}
            <div
              style={{
                padding: "0.875rem 1rem",
                background: "var(--surface-sunken, #f8fafc)",
                borderRadius: "var(--r-sm, 6px)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "0.375rem",
                fontSize: "var(--fs-sm)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>{tr("Stall Boarding:")}</span>
                <strong>{payingInvoice.boardingFee.toLocaleString()} đ</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>{tr("Medical & Veterinary:")}</span>
                <strong>{payingInvoice.medicalFee.toLocaleString()} đ</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>{tr("Conditioning & Training:")}</span>
                <strong>{payingInvoice.trainingFee.toLocaleString()} đ</strong>
              </div>
              {payingInvoice.prizeCredit > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--brand, #10b981)" }}>
                  <span>{tr("70% Race Prize Deduction:")}</span>
                  <strong>-{payingInvoice.prizeCredit.toLocaleString()} đ</strong>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "0.5rem",
                  marginTop: "0.25rem",
                  borderTop: "1px dashed var(--border)",
                  fontSize: "var(--fs-base, 1rem)",
                  fontWeight: 800,
                  color: "var(--ink)",
                }}
              >
                <span>{tr("Total Amount Due:")}</span>
                <span style={{ color: "var(--brand, #10b981)" }}>
                  {payingInvoice.netAmount.toLocaleString()} đ
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label style={{ display: "block", fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: "0.5rem" }}>
                {tr("Select Payment Method")}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("VIETQR")}
                  style={{
                    padding: "0.625rem 0.5rem",
                    borderRadius: "var(--r-sm, 6px)",
                    border: paymentMethod === "VIETQR" ? "2px solid var(--brand, #10b981)" : "1px solid var(--border)",
                    background: paymentMethod === "VIETQR" ? "var(--brand-muted, rgba(16, 185, 129, 0.08))" : "var(--surface)",
                    cursor: "pointer",
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: "var(--fs-xs)",
                    color: "var(--ink)",
                  }}
                >
                  📱 VietQR (Napas)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  style={{
                    padding: "0.625rem 0.5rem",
                    borderRadius: "var(--r-sm, 6px)",
                    border: paymentMethod === "CARD" ? "2px solid var(--brand, #10b981)" : "1px solid var(--border)",
                    background: paymentMethod === "CARD" ? "var(--brand-muted, rgba(16, 185, 129, 0.08))" : "var(--surface)",
                    cursor: "pointer",
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: "var(--fs-xs)",
                    color: "var(--ink)",
                  }}
                >
                  💳 Visa / Master
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("BALANCE")}
                  style={{
                    padding: "0.625rem 0.5rem",
                    borderRadius: "var(--r-sm, 6px)",
                    border: paymentMethod === "BALANCE" ? "2px solid var(--brand, #10b981)" : "1px solid var(--border)",
                    background: paymentMethod === "BALANCE" ? "var(--brand-muted, rgba(16, 185, 129, 0.08))" : "var(--surface)",
                    cursor: "pointer",
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: "var(--fs-xs)",
                    color: "var(--ink)",
                  }}
                >
                  🏦 {tr("Club Deposit")}
                </button>
              </div>
            </div>

            {/* Payment Method Details */}
            {paymentMethod === "VIETQR" && (
              <div
                style={{
                  padding: "1rem",
                  background: "var(--surface)",
                  borderRadius: "var(--r-sm, 6px)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  gap: "1.25rem",
                  alignItems: "center",
                }}
              >
                {/* VietQR Mock Card Visual */}
                <div
                  style={{
                    width: 130,
                    height: 130,
                    background: "#ffffff",
                    borderRadius: "var(--r-sm, 6px)",
                    border: "1px solid #cbd5e1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#005baa", marginBottom: 2 }}>
                    VIETQR | NAPAS247
                  </div>
                  {/* Stylized QR grid representation */}
                  <div
                    style={{
                      width: 90,
                      height: 90,
                      background: "repeating-linear-gradient(45deg, #1e293b, #1e293b 8px, #ffffff 8px, #ffffff 16px)",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ width: 28, height: 28, background: "#ffffff", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 900, color: "var(--brand, #10b981)" }}>
                      EQF
                    </div>
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "#64748b", marginTop: 2 }}>
                    {tr("Scan with Bank App")}
                  </div>
                </div>

                <div style={{ fontSize: "var(--fs-xs)", display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1 }}>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block" }}>{tr("Bank Name:")}</span>
                    <strong style={{ color: "var(--ink)", fontSize: "var(--fs-sm)" }}>Vietcombank (VCB)</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block" }}>{tr("Account Number:")}</span>
                    <strong style={{ color: "var(--brand, #10b981)", fontSize: "var(--fs-base)" }}>9876 5432 10</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block" }}>{tr("Beneficiary:")}</span>
                    <strong style={{ color: "var(--ink)" }}>CLB DUA NGUA EQUIFLOW</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", display: "block" }}>{tr("Transfer Note:")}</span>
                    <strong style={{ color: "var(--ink)", background: "var(--surface-sunken)", padding: "2px 6px", borderRadius: 4 }}>
                      EQUIFLOW {payingInvoice.id.slice(-6).toUpperCase()}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "CARD" && (
              <div
                style={{
                  padding: "1rem",
                  background: "var(--surface)",
                  borderRadius: "var(--r-sm, 6px)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  fontSize: "var(--fs-sm)",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--muted)", marginBottom: 4 }}>
                    {tr("Card Number")}
                  </label>
                  <input
                    type="text"
                    defaultValue="4111 2222 3333 4444"
                    style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)" }}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--muted)", marginBottom: 4 }}>
                      {tr("Expiry Date")}
                    </label>
                    <input
                      type="text"
                      defaultValue="12/28"
                      style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "var(--fs-xs)", color: "var(--muted)", marginBottom: 4 }}>
                      CVV / CVC
                    </label>
                    <input
                      type="password"
                      defaultValue="888"
                      style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "BALANCE" && (
              <div
                style={{
                  padding: "1rem",
                  background: "var(--surface-sunken)",
                  borderRadius: "var(--r-sm, 6px)",
                  border: "1px solid var(--border)",
                  fontSize: "var(--fs-sm)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>{tr("Club Deposit Balance:")}</span>
                  <strong style={{ color: "var(--brand, #10b981)" }}>50,000,000 đ</strong>
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--muted)" }}>
                  ✓ {tr("Sufficient deposit balance available. Amount will be deducted immediately.")}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

