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
  { value: "Thoroughbred", label: "Thoroughbred (Thuần chủng)" },
  { value: "Arabian", label: "Arabian (Ả Rập)" },
  { value: "Quarter Horse", label: "Quarter Horse" },
  { value: "Warmblood", label: "Warmblood" },
  { value: "Standardbred", label: "Standardbred" },
  { value: "Appaloosa", label: "Appaloosa" },
  { value: "Paint", label: "Paint" },
];

const GENDER_OPTIONS = [
  { value: "Colt", label: "Colt (Ngựa đực con < 4 tuổi)" },
  { value: "Stallion", label: "Stallion (Ngựa đực giống trưởng thành)" },
  { value: "Gelding", label: "Gelding (Ngựa đực thiến)" },
  { value: "Filly", label: "Filly (Ngựa cái con < 4 tuổi)" },
  { value: "Mare", label: "Mare (Ngựa cái trưởng thành)" },
];

const COLOR_OPTIONS = [
  { value: "Bay", label: "Bay (Hồng đào)" },
  { value: "Bay Dark", label: "Bay Dark (Hồng đậm)" },
  { value: "Chestnut", label: "Chestnut (Hạt dẻ)" },
  { value: "Black", label: "Black (Ô / Đen tuyền)" },
  { value: "Grey", label: "Grey (Bạch mã / Xám)" },
  { value: "Roan", label: "Roan (Lông đốm phấn)" },
  { value: "Palomino", label: "Palomino (Hoàng mã)" },
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
        const msg = err instanceof ApiError ? err.message : "Không tìm thấy hồ sơ ngựa.";
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
      errs.name = "Tên ngựa là bắt buộc.";
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      errs.name = "Tên ngựa phải từ 2 đến 100 ký tự.";
    } else if (!/^[a-zA-Z0-9\s'.-]+$/.test(name.trim())) {
      errs.name = "Tên ngựa chỉ được chứa chữ cái, chữ số, khoảng trắng và các ký tự ' - .";
    }

    if (!breed) {
      errs.breed = "Vui lòng chọn giống ngựa.";
    }

    if (!dob) {
      errs.dob = "Ngày sinh là bắt buộc.";
    } else {
      const birth = new Date(dob);
      const now = new Date();
      const fortyYearsAgo = new Date();
      fortyYearsAgo.setFullYear(now.getFullYear() - 40);

      if (birth > now) {
        errs.dob = "Ngày sinh không được sau ngày hiện tại.";
      } else if (birth < fortyYearsAgo) {
        errs.dob = "Ngày sinh không được sớm hơn 40 năm tính đến ngày hiện tại.";
      }
    }

    if (!gender) {
      errs.gender = "Vui lòng chọn giới tính.";
    }

    if (!color) {
      errs.color = "Vui lòng chọn màu lông.";
    }

    if (!microchip.trim()) {
      errs.microchip = "Số microchip là bắt buộc.";
    } else if (!/^\d{15}$/.test(microchip.trim())) {
      errs.microchip = "Số microchip phải gồm đúng 15 chữ số.";
    }

    if (rfid.trim() && !/^[A-Z0-9-]{4,32}$/.test(rfid.trim().toUpperCase())) {
      errs.rfid = "Mã thẻ RFID phải từ 4 đến 32 ký tự, chỉ gồm chữ in hoa A-Z, chữ số và dấu gạch ngang.";
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
        toast.show(`Đã cập nhật hồ sơ ngựa ${saved.name}.`, "ok");
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
        toast.show(`Đã tạo hồ sơ ngựa ${saved.name}.`, "ok");

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
          setErrors((prev) => ({ ...prev, name: "Tên ngựa đã tồn tại trong hệ thống." }));
        } else if (err.code === "DUPLICATE_MICROCHIP") {
          setErrors((prev) => ({ ...prev, microchip: "Số microchip đã được gán cho ngựa khác." }));
        } else if (err.code === "DUPLICATE_RFID") {
          setErrors((prev) => ({ ...prev, rfid: "Mã thẻ RFID đã được gán cho ngựa khác." }));
        } else if (err.code === "INVALID_DOB") {
          setErrors((prev) => ({ ...prev, dob: err.message || "Ngày sinh không hợp lệ." }));
        } else {
          setGeneralError(err.message || "Có lỗi xảy ra khi lưu hồ sơ ngựa.");
        }
      } else {
        setGeneralError("Mất kết nối máy chủ. Vui lòng thử lại.");
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
          eyebrow="QUẢN LÝ ĐÀN NGỰA"
          title="Hồ Sơ Ngừng Quản Lý"
          description="Ngựa đã ngừng quản lý. Vui lòng kích hoạt lại trước khi thao tác chỉnh sửa."
        />
        <Card pad={24}>
          <Alert tone="warn" title="Không thể chỉnh sửa">
            Ngựa đã ngừng quản lý. Vui lòng kích hoạt lại trước khi thao tác.
          </Alert>
          <div style={{ marginTop: "1rem" }}>
            <Link to={id ? `/horses/${id}` : "/horses"}>
              <Button tone="secondary">Về hồ sơ</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <PageHeader eyebrow="QUẢN LÝ ĐÀN NGỰA" title={isEdit ? "Cập Nhật Hồ Sơ Ngựa" : "Thêm Ngựa Mới"} />
        <Card pad={32}>
          <p style={{ color: "var(--ink-muted, #64748b)" }}>Đang tải dữ liệu hồ sơ ngựa...</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="QUẢN LÝ ĐÀN NGỰA · FLOW 1"
        title={isEdit ? `Cập Nhật Hồ Sơ Ngựa: ${name || horseCode}` : "Tạo Hồ Sơ Định Danh Ngựa Mới"}
        description={
          isEdit
            ? "Cập nhật các thông tin định danh gốc cho cá thể ngựa."
            : "Nhập thông tin định danh cơ bản của ngựa. Mã ngựa sẽ được hệ thống tự động sinh khi lưu."
        }
        action={
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Button tone="secondary" onClick={handleCancel}>
              Hủy
            </Button>
            {!isEdit && (
              <Button
                tone="secondary"
                disabled={submitting}
                onClick={() => handleSave(true)}
              >
                Lưu và thêm ngựa khác
              </Button>
            )}
            <Button
              tone="primary"
              disabled={submitting}
              onClick={() => handleSave(false)}
            >
              {submitting ? "Đang lưu..." : "Lưu hồ sơ"}
            </Button>
          </div>
        }
      />

      {generalError && (
        <Alert tone="danger" title="Lỗi">
          {generalError}
        </Alert>
      )}

      <Card pad={24}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {/* Cột 1: Định danh cơ bản */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, borderBottom: "1px solid var(--border, #e2e8f0)", paddingBottom: "0.5rem" }}>
              1. Thông Tin Định Danh
            </h3>

            <Field label="Mã ngựa (Horse ID)" hint="Hệ thống tự động sinh mã dạng HR-XXXXXX khi lưu">
              <Input
                value={isEdit ? horseCode : "Tự động sinh khi lưu"}
                disabled
                readOnly
              />
            </Field>

            <Field label="Tên ngựa *" error={errors.name} hint="Từ 2 đến 100 ký tự (chữ cái, chữ số, khoảng trắng, ' - .)">
              <Input
                placeholder="Nhập tên ngựa..."
                value={name}
                invalid={Boolean(errors.name)}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsDirty(true);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
              />
            </Field>

            <Field label="Số microchip *" error={errors.microchip} hint="Đúng 15 chữ số định danh sinh học bắt buộc">
              <Input
                placeholder="Nhập 15 chữ số..."
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

            <Field label="Mã thẻ RFID (Tùy chọn)" error={errors.rfid} hint="Từ 4 đến 32 ký tự, chỉ gồm A-Z, 0-9 và dấu gạch ngang">
              <Input
                placeholder="Ví dụ: RFID-985141002341..."
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

          {/* Cột 2: Đặc tính sinh học */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, borderBottom: "1px solid var(--border, #e2e8f0)", paddingBottom: "0.5rem" }}>
              2. Đặc Tính Sinh Học & Nguồn Gốc
            </h3>

            <Field label="Giống ngựa *" error={errors.breed}>
              <Select
                value={breed}
                options={BREED_OPTIONS}
                onChange={(e) => {
                  setBreed(e.target.value);
                  setIsDirty(true);
                }}
              />
            </Field>

            <Field label="Ngày sinh *" error={errors.dob} hint="Không sau hôm nay, không sớm hơn 40 năm">
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

            <Field label="Giới tính *" error={errors.gender}>
              <Select
                value={gender}
                options={GENDER_OPTIONS}
                onChange={(e) => {
                  setGender(e.target.value);
                  setIsDirty(true);
                }}
              />
            </Field>

            <Field label="Màu lông *" error={errors.color}>
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
            Hủy
          </Button>
          {!isEdit && (
            <Button
              tone="secondary"
              disabled={submitting}
              onClick={() => handleSave(true)}
            >
              Lưu và thêm ngựa khác
            </Button>
          )}
          <Button
            tone="primary"
            disabled={submitting}
            onClick={() => handleSave(false)}
          >
            {submitting ? "Đang lưu..." : "Lưu hồ sơ"}
          </Button>
        </div>
      </Card>

      {/* Cảnh báo rời form khi có dữ liệu chưa lưu (FR-1.26 / DL-1.12) */}
      {showCancelConfirm && (
        <ConfirmModal
          title="Xác nhận rời khỏi trang"
          confirmLabel="Rời khỏi"
          cancelLabel="Tiếp tục chỉnh sửa"
          tone="danger"
          onConfirm={() => {
            setShowCancelConfirm(false);
            setIsDirty(false);
            navigate(-1);
          }}
          onCancel={() => setShowCancelConfirm(false)}
        >
          <p style={{ margin: 0, color: "var(--ink-muted, #64748b)" }}>
            Bạn có thay đổi chưa được lưu trên biểu mẫu. Nếu rời đi bây giờ, mọi dữ liệu vừa nhập sẽ bị mất. Bạn có chắc chắn muốn rời đi không?
          </p>
        </ConfirmModal>
      )}
    </div>
  );
}
