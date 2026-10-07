import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Card } from "@/shared/components/ui/Card";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/form/Input";
import { Select } from "@/shared/components/form/Select";
import { Field } from "@/shared/components/form/Field";
import { Alert } from "@/shared/components/ui/Alert";
import { ConfirmModal } from "@/shared/components/ui/ConfirmModal";
import { useToast } from "@/shared/components/ui/Toast";
import { ApiError } from "@/shared/lib/api";
import { getHorseById, createHorse, updateHorse } from "../api";
import type { Horse, CreateHorsePayload, UpdateHorsePayload } from "../types";

const BREED_OPTIONS = [
  { value: "Thoroughbred", label: "Thoroughbred" },
  { value: "Arabian", label: "Arabian" },
  { value: "Quarter Horse", label: "Quarter Horse" },
  { value: "Warmblood", label: "Warmblood" },
  { value: "Standardbred", label: "Standardbred" },
  { value: "Appaloosa", label: "Appaloosa" },
  { value: "Paint", label: "Paint" },
];

const GENDER_OPTIONS = [
  { value: "Colt", label: "Colt (Young male < 4 yrs)" },
  { value: "Stallion", label: "Stallion (Intact adult male)" },
  { value: "Gelding", label: "Gelding (Castrated male)" },
  { value: "Filly", label: "Filly (Young female < 4 yrs)" },
  { value: "Mare", label: "Mare (Adult female)" },
];

const COLOR_OPTIONS = [
  { value: "Bay", label: "Bay" },
  { value: "Bay Dark", label: "Bay Dark" },
  { value: "Chestnut", label: "Chestnut" },
  { value: "Black", label: "Black" },
  { value: "Grey", label: "Grey" },
  { value: "Roan", label: "Roan" },
  { value: "Palomino", label: "Palomino" },
];

export default function HorseFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [retiredError, setRetiredError] = useState(false);

  // Form fields
  const [horseCode, setHorseCode] = useState("");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("Thoroughbred");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Colt");
  const [color, setColor] = useState("Bay");
  const [microchip, setMicrochip] = useState("");
  const [rfid, setRfid] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;
    getHorseById(id)
      .then((horse: Horse) => {
        if (!active) return;
        if (horse.status === "RETIRED") {
          setRetiredError(true);
          return;
        }
        setHorseCode(horse.horseCode || "");
        setName(horse.name || "");
        setBreed(horse.breed || "Thoroughbred");
        setDob(horse.dob ? horse.dob.split("T")[0] : "");
        setGender(horse.gender || "Colt");
        setColor(horse.color || "Bay");
        setMicrochip(horse.microchip || horse.microchipRfid || "");
        setRfid(horse.rfid || "");
      })
      .catch((err) => {
        if (!active) return;
        const msg = err instanceof ApiError ? err.message : "Horse profile not found.";
        setGeneralError(msg);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = "Horse name is required.";
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      errs.name = "Horse name must be between 2 and 100 characters.";
    } else if (!/^[a-zA-Z0-9\s'.-]+$/.test(name.trim())) {
      errs.name = "Horse name can only contain letters, numbers, spaces, and ' - .";
    }

    if (!breed) {
      errs.breed = "Please select a horse breed.";
    }

    if (!dob) {
      errs.dob = "Date of birth is required.";
    } else {
      const birth = new Date(dob);
      const now = new Date();
      const fortyYearsAgo = new Date();
      fortyYearsAgo.setFullYear(now.getFullYear() - 40);

      if (birth > now) {
        errs.dob = "Date of birth cannot be in the future.";
      } else if (birth < fortyYearsAgo) {
        errs.dob = "Date of birth cannot exceed 40 years ago.";
      }
    }

    if (!gender) {
      errs.gender = "Please select a gender.";
    }

    if (!color) {
      errs.color = "Please select a coat color.";
    }

    if (!microchip.trim()) {
      errs.microchip = "Microchip number is required.";
    } else if (!/^\d{15}$/.test(microchip.trim())) {
      errs.microchip = "Microchip number must consist of exactly 15 digits.";
    }

    if (rfid.trim() && !/^RFID-[A-Z0-9-]{4,28}$/.test(rfid.trim().toUpperCase())) {
      errs.rfid = "RFID tag must start with 'RFID-' prefix followed by 4-28 uppercase letters, digits, or hyphens.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave(andAddAnother = false) {
    if (!validate()) return;
    setSubmitting(true);
    setGeneralError("");

    try {
      if (isEdit && id) {
        const payload: UpdateHorsePayload = {
          name: name.trim(),
          breed,
          dob,
          gender,
          color,
          microchip: microchip.trim(),
          rfid: rfid.trim() ? rfid.trim().toUpperCase() : undefined,
        };
        const saved = await updateHorse(id, payload);
        toast.show(`Horse profile ${saved.name} updated successfully.`, "ok");
        setIsDirty(false);
        navigate(`/horses/${saved.id}`);
      } else {
        const payload: CreateHorsePayload = {
          name: name.trim(),
          breed,
          dob,
          gender,
          color,
          microchip: microchip.trim(),
          rfid: rfid.trim() ? rfid.trim().toUpperCase() : undefined,
          status: "RESTING",
        };
        const saved = await createHorse(payload);
        toast.show(`Horse profile ${saved.name} created successfully.`, "ok");

        if (andAddAnother) {
          setName("");
          setDob("");
          setMicrochip("");
          setRfid("");
          setErrors({});
          setIsDirty(false);
        } else {
          setIsDirty(false);
          navigate(`/horses/${saved.id}`);
        }
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.code === "DUPLICATE_NAME") {
          setErrors((prev) => ({ ...prev, name: "Horse name already exists in the stable system." }));
        } else if (err.code === "DUPLICATE_MICROCHIP") {
          setErrors((prev) => ({ ...prev, microchip: "Microchip number is already registered to another horse." }));
        } else if (err.code === "DUPLICATE_RFID") {
          setErrors((prev) => ({ ...prev, rfid: "RFID tag code is already assigned to another horse." }));
        } else if (err.code === "INVALID_DOB") {
          setErrors((prev) => ({ ...prev, dob: err.message || "Invalid date of birth." }));
        } else {
          setGeneralError(err.message || "An error occurred while saving the horse profile.");
        }
      } else {
        setGeneralError("Server connection error. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      navigate(-1);
    }
  }

  if (retiredError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <PageHeader
          eyebrow="HORSE ROSTER · FLOW 1"
          title="Retired Horse Record"
          description="This horse has been retired. Please reactivate prior to performing profile edits."
        />
        <Card pad={24}>
          <Alert tone="warn" title="Editing Restricted">
            This horse is marked as Retired. Historical profiles cannot be modified without reactivation.
          </Alert>
          <div style={{ marginTop: "1rem" }}>
            <Link to={id ? `/horses/${id}` : "/horses"}>
              <Button tone="secondary">Back to Profile</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <PageHeader eyebrow="HORSE ROSTER · FLOW 1" title={isEdit ? "Update Horse Profile" : "Register New Racehorse"} />
        <Card pad={32}>
          <p style={{ color: "var(--ink-muted, #64748b)" }}>Loading horse profile data...</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="HORSE ROSTER · FLOW 1"
        title={isEdit ? `Update Horse Profile: ${name || horseCode}` : "Register New Racehorse"}
        description={
          isEdit
            ? "Update baseline pedigree and identity records for this racehorse."
            : "Enter baseline identity credentials. System will automatically generate a HR-XXXXXX code upon save."
        }
        action={
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Button tone="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            {!isEdit && (
              <Button
                tone="secondary"
                disabled={submitting}
                onClick={() => handleSave(true)}
              >
                Save & Add Another
              </Button>
            )}
            <Button
              tone="primary"
              disabled={submitting}
              onClick={() => handleSave(false)}
            >
              {submitting ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        }
      />

      {generalError && (
        <Alert tone="danger" title="Error">
          {generalError}
        </Alert>
      )}

      <Card pad={24}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {/* Column 1: Identity */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, borderBottom: "1px solid var(--border, #e2e8f0)", paddingBottom: "0.5rem" }}>
              1. Identity Credentials
            </h3>

            <Field label="Horse Code (ID)" hint="System auto-generates code formatted as HR-XXXXXX upon save">
              <Input
                value={isEdit ? horseCode : "Auto-generated on save"}
                disabled
                readOnly
              />
            </Field>

            <Field label="Horse Name *" error={errors.name} hint="Between 2 and 100 characters (alphanumeric, spaces, ' - .)">
              <Input
                placeholder="Enter horse name..."
                value={name}
                invalid={Boolean(errors.name)}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsDirty(true);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
              />
            </Field>

            <Field label="Microchip Number *" error={errors.microchip} hint="Exact 15-digit biological ID">
              <Input
                placeholder="Enter 15 digits..."
                value={microchip}
                invalid={Boolean(errors.microchip)}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 15);
                  setMicrochip(val);
                  setIsDirty(true);
                  if (errors.microchip) setErrors((prev) => ({ ...prev, microchip: "" }));
                }}
              />
            </Field>

            <Field label="RFID Tag Code (Optional)" error={errors.rfid} hint="Prefix RFID- followed by 4-28 uppercase letters/digits, e.g. RFID-985141002341">
              <Input
                placeholder="e.g. RFID-985141002341..."
                value={rfid}
                invalid={Boolean(errors.rfid)}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setRfid(val);
                  setIsDirty(true);
                  if (errors.rfid) setErrors((prev) => ({ ...prev, rfid: "" }));
                }}
              />
            </Field>
          </div>

          {/* Column 2: Traits & Pedigree */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, borderBottom: "1px solid var(--border, #e2e8f0)", paddingBottom: "0.5rem" }}>
              2. Biological Traits & Pedigree
            </h3>

            <Field label="Breed *" error={errors.breed}>
              <Select
                value={breed}
                options={BREED_OPTIONS}
                onChange={(e) => {
                  setBreed(e.target.value);
                  setIsDirty(true);
                }}
              />
            </Field>

            <Field label="Date of Birth *" error={errors.dob} hint="Must not be in the future or older than 40 years">
              <Input
                type="date"
                value={dob}
                invalid={Boolean(errors.dob)}
                onChange={(e) => {
                  setDob(e.target.value);
                  setIsDirty(true);
                  if (errors.dob) setErrors((prev) => ({ ...prev, dob: "" }));
                }}
              />
            </Field>

            <Field label="Gender *" error={errors.gender}>
              <Select
                value={gender}
                options={GENDER_OPTIONS}
                onChange={(e) => {
                  setGender(e.target.value);
                  setIsDirty(true);
                }}
              />
            </Field>

            <Field label="Coat Color *" error={errors.color}>
              <Select
                value={color}
                options={COLOR_OPTIONS}
                onChange={(e) => {
                  setColor(e.target.value);
                  setIsDirty(true);
                }}
              />
            </Field>
          </div>
        </div>

        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--border, #e2e8f0)", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button tone="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          {!isEdit && (
            <Button
              tone="secondary"
              disabled={submitting}
              onClick={() => handleSave(true)}
            >
              Save & Add Another
            </Button>
          )}
          <Button
            tone="primary"
            disabled={submitting}
            onClick={() => handleSave(false)}
          >
            {submitting ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </Card>

      {/* Discard changes modal */}
      {showCancelConfirm && (
        <ConfirmModal
          title="Discard Unsaved Changes"
          confirmLabel="Discard & Leave"
          cancelLabel="Keep Editing"
          tone="danger"
          onConfirm={() => {
            setShowCancelConfirm(false);
            setIsDirty(false);
            navigate(-1);
          }}
          onCancel={() => setShowCancelConfirm(false)}
        >
          <p style={{ margin: 0, color: "var(--ink-muted, #64748b)" }}>
            You have unsaved changes on this form. If you leave now, all input will be lost. Are you sure you want to discard?
          </p>
        </ConfirmModal>
      )}
    </div>
  );
}
