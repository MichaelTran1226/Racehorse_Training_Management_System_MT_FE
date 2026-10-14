import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { Field } from "@/shared/components/form/Field";
import { Badge } from "@/shared/components/ui/Badge";
import { Card } from "@/shared/components/ui/Card";
import { DataTable, type Column } from "@/shared/components/ui/DataTable";
import { Tabs } from "@/shared/components/ui/Tabs";
import { Select } from "@/shared/components/form/Select";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { formatDate } from "@/shared/lib/format";
import type { BadgeTone } from "@/shared/lib/status";
import { Input } from "@/shared/components/form/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { Textarea } from "@/shared/components/form/Textarea";
import { useAuth } from "@/shared/components/layout/AuthProvider";
import { useToast } from "@/shared/components/ui/Toast";
import { healthApi } from "../api";
import type { PreventiveCareItem, PreventiveStatus } from "../types";

import { tr } from "@/shared/i18n/tr";
const CATEGORY_LABELS: Record<string, string> = {
  ALL: "All Categories",
  VACCINATION: "Vaccination",
  DEWORMING: "Deworming",
  FARRIER: "Farrier Care",
  DENTAL: "Dental Care",
  GENERAL: "Routine Checkup",
};

// Trạng thái lịch dự phòng -> tông Badge chung (một màu một nghĩa trong toàn app).
const STATUS_BADGES: Record<PreventiveStatus, { label: string; tone: BadgeTone; icon: string }> = {
  UP_TO_DATE: { label: "Up to date", tone: "ok", icon: "checkCircle" },
  DUE_SOON: { label: "Due soon", tone: "warn", icon: "clock" },
  OVERDUE: { label: "Overdue", tone: "danger", icon: "alert" },
  NO_DATA: { label: "No data", tone: "neutral", icon: "info" },
};

export default function CareSchedulePage() {
  const { user } = useAuth();
  const toast = useToast();
  const isVet = user?.role === "VETERINARIAN";

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [items, setItems] = useState<PreventiveCareItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");


  // Record Completion Modal (DL-3.12)
  const [selectedCare, setSelectedCare] = useState<PreventiveCareItem | null>(null);
  const [adminDate, setAdminDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [adminBy, setAdminBy] = useState<string>(user?.fullName || "");
  const [performedByMode, setPerformedByMode] = useState<"SELF" | "EXTERNAL">("SELF");
  const [productAdministered, setProductAdministered] = useState<string>("");
  const [batchNumber, setBatchNumber] = useState<string>("");
  const [nextDue, setNextDue] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await healthApi.getCareSchedules();
      setItems(data);
    } catch {
      toast.show("Unable to load preventive care schedules", "danger");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const handleSync = () => {
      void loadData();
    };
    window.addEventListener("horsesUpdated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("horsesUpdated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [loadData]);

  const handleOpenCompleteModal = (care: PreventiveCareItem) => {
    setSelectedCare(care);
    setAdminDate(new Date().toISOString().split("T")[0]);
    setAdminBy(user?.fullName || "Lead Veterinarian");
    setPerformedByMode("SELF");
    setProductAdministered(care.type || "");
    setBatchNumber("");
    const nextDate = new Date();
    if (care.category === "VACCINATION") nextDate.setMonth(nextDate.getMonth() + 6);
    else if (care.category === "DEWORMING") nextDate.setMonth(nextDate.getMonth() + 3);
    else if (care.category === "FARRIER") nextDate.setDate(nextDate.getDate() + 35);
    else nextDate.setFullYear(nextDate.getFullYear() + 1);
    setNextDue(nextDate.toISOString().split("T")[0]);
    setNotes("");
  };

  const handleSubmitComplete = async () => {
    if (!selectedCare) return;
    try {
      setSubmitting(true);
      await healthApi.recordCareCompletion(selectedCare.id, {
        administeredDate: adminDate,
        administeredBy: adminBy,
        nextDueDate: nextDue,
        notes,
        performedByMode,
        productAdministered,
        batchNumber,
      });
      toast.show(`Recorded completion: ${selectedCare.type}`, "ok");
      setSelectedCare(null);
      void loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Error recording care completion";
      toast.show(msg, "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesTab =
      activeTab === "ALL"
        ? true
        : activeTab === "OVERDUE"
        ? item.status === "OVERDUE"
        : activeTab === "DUE_SOON"
        ? item.status === "DUE_SOON"
        : item.status === "UP_TO_DATE";

    const matchesCategory = selectedCategory === "ALL" ? true : item.category === selectedCategory;

    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.horseId.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q));

    return matchesTab && matchesCategory && matchesSearch;
  });

  const count = (st: PreventiveStatus) => items.filter((i) => i.status === st).length;

  const columns: Column<PreventiveCareItem>[] = [
    {
      key: "service",
      header: "Care service",
      render: (item) => <span style={{ display: "block", minWidth: 240, maxWidth: 340, fontWeight: 600 }}>{item.type}</span>,
    },
    {
      key: "horse",
      header: "Horse",
      render: (item) => (
        <Link to="/medical/records" style={{ display: "block", minWidth: 140, maxWidth: 200, fontWeight: 600, color: "var(--text)" }}>
          {item.horseId}
        </Link>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (item) => <Badge tone="neutral">{CATEGORY_LABELS[item.category] || item.category}</Badge>,
    },
    {
      key: "last",
      header: "Last given",
      render: (item) => (
        <div style={{ display: "grid" }}>
          <span className="num nowrap">{item.lastAdministeredDate ? formatDate(item.lastAdministeredDate) : tr("Not recorded")}</span>
          {item.administeredBy && (
            <span className="nowrap" style={{ fontSize: "var(--fs-caption)", lineHeight: "18px", color: "var(--muted)" }}>
              {item.administeredBy}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "due",
      header: "Due",
      render: (item) => (
        <span className="num nowrap" style={{ color: item.status === "OVERDUE" ? "var(--danger)" : undefined, fontWeight: item.status === "OVERDUE" ? 600 : undefined }}>
          {formatDate(item.dueDate)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => {
        const st = STATUS_BADGES[item.status] || STATUS_BADGES.NO_DATA;
        return (
          <Badge tone={st.tone} icon={st.icon}>
            {st.label}
          </Badge>
        );
      },
    },
    {
      key: "notes",
      header: "Notes",
      hideOnNarrow: true,
      render: (item) => (
        <span
          title={item.notes || undefined}
          style={{
            maxWidth: 200,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            fontSize: "var(--fs-caption)",
            lineHeight: "18px",
            color: "var(--text-2)",
          }}
        >
          {item.notes || "—"}
        </span>
      ),
    },
    ...(isVet
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (item: PreventiveCareItem) => (
              <Button tone="secondary" size="sm" icon="check" onClick={() => handleOpenCompleteModal(item)}>
                {tr("Record")}
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <PageHeader
        title={tr("Preventive care")}
        description={tr("Vaccinations, deworming, farrier and dental care for every horse, with the next due date.")}
      />

      <Card pad={0}>
        <div style={{ padding: "0 20px", borderBottom: "1px solid var(--border)" }}>
          <Tabs
            label={tr("Filter by status")}
            items={[
              { id: "ALL", label: "All", count: items.length },
              { id: "OVERDUE", label: "Overdue", count: count("OVERDUE") },
              { id: "DUE_SOON", label: "Due soon", count: count("DUE_SOON") },
              { id: "UP_TO_DATE", label: "Up to date", count: count("UP_TO_DATE") },
            ]}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", padding: "16px 20px" }}>
          <div style={{ flex: "1 1 260px", maxWidth: 360 }}>
            <Input
              icon="search"
              aria-label={tr("Search care items")}
              placeholder={tr("Service, horse or note")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ width: 200 }}>
            <Select
              aria-label={tr("Category")}
              value={selectedCategory}
              options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label: value === "ALL" ? "Category: All" : label }))}
              onChange={(e) => setSelectedCategory(e.target.value)}
            />
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <DataTable
            caption={tr("Preventive care schedule")}
            columns={columns}
            rows={filteredItems}
            rowKey={(item) => item.id}
            loading={loading}
            empty={
              <EmptyState
                icon="syringe"
                title={search || selectedCategory !== "ALL" || activeTab !== "ALL" ? "No care items match these filters" : "No preventive care scheduled yet"}
                description="Scheduled vaccinations, deworming, farrier and dental care appear here with their due dates."
              />
            }
          />
        </div>
      </Card>

      {/* Record Completion Modal (DL-3.12) */}
      {selectedCare && (
        <Modal
          onClose={() => setSelectedCare(null)}
          title={tr(`Record completion: ${selectedCare.type}`)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                padding: "0.75rem 1rem",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r)",
                fontSize: "var(--fs-body)",
              }}
            >
              <div>
                <strong>{tr("Horse:")}</strong> {selectedCare.horseId}
              </div>
              <div style={{ marginTop: 3 }}>
                <strong>{tr("Service:")}</strong> {selectedCare.type} (
                {CATEGORY_LABELS[selectedCare.category] || selectedCare.category})
              </div>
            </div>

            <Field label={tr("Administered Date")} required>
              <Input
                type="date"
                value={adminDate}
                onChange={(e) => setAdminDate(e.target.value)}
              />
            </Field>

            <Field label={tr("Administered By / Vet Clinic")} required>
              <Input
                value={adminBy}
                onChange={(e) => setAdminBy(e.target.value)}
                placeholder={tr("Veterinarian or clinic name")}
              />
            </Field>

            <Field label={tr("Performed By Mode")} required>
              <Select
                value={performedByMode}
                onChange={(e) => setPerformedByMode(e.target.value as "SELF" | "EXTERNAL")}
                options={[
                  { value: "SELF", label: "Self (Internal Vet / Staff)" },
                  { value: "EXTERNAL", label: "External (External Clinic / Partner)" },
                ]}
              />
            </Field>

            <Field label={tr("Product / Vaccine Administered")}>
              <Input
                value={productAdministered}
                onChange={(e) => setProductAdministered(e.target.value)}
                placeholder={tr("e.g., Equi-Flu Standard Formulation")}
              />
            </Field>

            <Field label={tr("Batch / Lot Number")}>
              <Input
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder={tr("e.g., LOT-2026-VACC-091")}
              />
            </Field>

            <Field
              label={tr("Next Due Date")}
              required
              hint="Auto-calculated from protocol interval; can be manually adjusted"
            >
              <Input
                type="date"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
              />
            </Field>

            <Field label={tr("Notes & Post-Care Observations")}>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={tr("e.g., Deep IM injection, no febrile reaction, normal appetite and gait...")}
              />
            </Field>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "0.5rem",
              }}
            >
              <Button tone="ghost" onClick={() => setSelectedCare(null)}>
                {tr("Cancel")}
              </Button>
              <Button
                tone="primary"
                onClick={() => void handleSubmitComplete()}
                disabled={submitting}
              >
                {submitting ? tr("Saving...") : tr("Confirm Completion")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
