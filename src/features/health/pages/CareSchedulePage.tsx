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
import { getHorses } from "@/features/horses/api";
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

  // Create Preventive Care Schedule Modal (Bác sĩ thú y thêm Preventive Care)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [horseList, setHorseList] = useState<Array<{ id: string; name: string; horseCode?: string }>>([]);
  const [createHorseId, setCreateHorseId] = useState<string>("");
  const [createCategory, setCreateCategory] = useState<"VACCINATION" | "DEWORMING" | "FARRIER" | "DENTAL" | "GENERAL">("VACCINATION");
  const [createType, setCreateType] = useState<string>("Equine Influenza & Tetanus Booster");
  const [createDueDate, setCreateDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [createNotes, setCreateNotes] = useState<string>("");

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

  const handleOpenCreateModal = async () => {
    try {
      const res = await getHorses({ limit: 100 });
      const list = res.items || [];
      setHorseList(list);
      if (list.length > 0 && !createHorseId) {
        setCreateHorseId(list[0].id);
      }
    } catch {
      // fallback
    }
    setShowCreateModal(true);
  };

  const handleCreateSchedule = async () => {
    if (!createHorseId) {
      toast.show(tr("Please select a horse"), "danger");
      return;
    }
    if (!createType.trim()) {
      toast.show(tr("Please enter care service name"), "danger");
      return;
    }
    try {
      setSubmitting(true);
      await healthApi.createCareSchedule({
        horseId: createHorseId,
        category: createCategory,
        type: createType.trim(),
        dueDate: createDueDate,
        notes: createNotes.trim() || undefined,
      });
      toast.show(tr("Preventive care schedule created successfully"), "ok");
      setShowCreateModal(false);
      setCreateNotes("");
      void loadData();
    } catch (err: any) {
      toast.show(err?.message || "Failed to create care schedule", "danger");
    } finally {
      setSubmitting(false);
    }
  };

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
        horseId: selectedCare.realHorseId,
        typeCatalogId: selectedCare.typeCatalogId,
        administeredDate: adminDate,
        administeredBy: adminBy,
        nextDueDate: nextDue,
        notes: notes.trim() || undefined,
        performedByMode,
        productAdministered: productAdministered.trim() || undefined,
        batchNumber: batchNumber.trim() || undefined,
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
        description={tr("Vaccinations, deworming, farrier, and dental schedules for all horses.")}
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

            <Field
              label={tr("Batch / Lot Number (Optional)")}
              hint={tr("Leave blank if not applicable or unavailable")}
            >
              <Input
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder={tr("e.g., LOT-2026-VACC-091 (optional)")}
              />
            </Field>

            <Field
              label={tr("Next Due Date")}
              required
              hint={tr("Auto-calculated from protocol interval; can be manually adjusted")}
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

      {showCreateModal && (
        <Modal
          title={tr("Schedule Preventive Care")}
          subtitle={tr("Plan an upcoming preventive care event for a racehorse.")}
          width={540}
          onClose={() => setShowCreateModal(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Field label={tr("Select Horse *")}>
              <Select
                value={createHorseId}
                onChange={(e) => setCreateHorseId(e.target.value)}
                options={[
                  { value: "", label: tr("— Select a horse —") },
                  ...horseList.map((h) => ({
                    value: h.id,
                    label: `${h.name} (${h.horseCode || h.id.slice(0, 6)})`,
                  })),
                ]}
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label={tr("Category *")}>
                <Select
                  value={createCategory}
                  onChange={(e) => {
                    const cat = e.target.value as any;
                    setCreateCategory(cat);
                    if (cat === "VACCINATION") setCreateType("Equine Influenza & Tetanus Booster");
                    else if (cat === "DEWORMING") setCreateType("Ivermectin Paste Deworming");
                    else if (cat === "FARRIER") setCreateType("Routine Hoof Trimming & Shoe Reset");
                    else if (cat === "DENTAL") setCreateType("Annual Dental Floating & Oral Exam");
                    else setCreateType("Routine Health Screening");
                  }}
                  options={[
                    { value: "VACCINATION", label: tr("Vaccination") },
                    { value: "DEWORMING", label: tr("Deworming") },
                    { value: "FARRIER", label: tr("Farrier Care") },
                    { value: "DENTAL", label: tr("Dental Care") },
                    { value: "GENERAL", label: tr("Routine Checkup") },
                  ]}
                />
              </Field>

              <Field label={tr("Due Date *")}>
                <Input
                  type="date"
                  value={createDueDate}
                  onChange={(e) => setCreateDueDate(e.target.value)}
                />
              </Field>
            </div>

            <Field label={tr("Care Procedure / Vaccine Name *")}>
              <Input
                value={createType}
                onChange={(e) => setCreateType(e.target.value)}
                placeholder={tr("e.g. Equine Influenza & Tetanus Booster")}
              />
            </Field>

            <Field label={tr("Clinical Notes / Instructions")}>
              <Textarea
                rows={3}
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                placeholder={tr("Instructions, target product, or specific health precautions...")}
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button tone="ghost" onClick={() => setShowCreateModal(false)}>
                {tr("Cancel")}
              </Button>
              <Button tone="primary" onClick={() => void handleCreateSchedule()} disabled={submitting}>
                {submitting ? tr("Scheduling...") : tr("Create Schedule")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
