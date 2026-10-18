import type { FinancialInvoice } from "@/features/financial/types";

const FINANCIAL_STORAGE_KEY = "equiflow_mock_invoices";

const INITIAL_INVOICES: FinancialInvoice[] = [
  {
    id: "inv-01",
    horseId: "h-01",
    horse: {
      id: "h-01",
      name: "Thunder Bolt",
      horseCode: "HRS-001",
      breed: "Thoroughbred",
    },
    ownerId: "u-owner-01",
    owner: {
      id: "u-owner-01",
      fullName: "Ha Ly",
      email: "ha.ly@gmail.com",
      phoneNumber: "0901234567",
    },
    billingPeriod: "2026-09",
    boardingFee: 6000000,
    medicalFee: 1500000,
    trainingFee: 4000000,
    prizeCredit: 35000000, // 50M * 0.7 from Saigon Sprint win!
    netAmount: -23500000, // Negative: Club owes Owner 23.5M VND in prize payout!
    status: "PAID",
    createdAt: "2026-09-25T08:00:00Z",
    updatedAt: "2026-09-28T10:00:00Z",
  },
  {
    id: "inv-02",
    horseId: "h-01",
    horse: {
      id: "h-01",
      name: "Thunder Bolt",
      horseCode: "HRS-001",
      breed: "Thoroughbred",
    },
    ownerId: "u-owner-01",
    owner: {
      id: "u-owner-01",
      fullName: "Ha Ly",
      email: "ha.ly@gmail.com",
      phoneNumber: "0901234567",
    },
    billingPeriod: "2026-10",
    boardingFee: 6000000,
    medicalFee: 2000000,
    trainingFee: 4000000,
    prizeCredit: 0,
    netAmount: 12000000,
    status: "SENT",
    createdAt: "2026-10-01T08:00:00Z",
    updatedAt: "2026-10-05T09:00:00Z",
  },
  {
    id: "inv-03",
    horseId: "h-02",
    horse: {
      id: "h-02",
      name: "Golden Pegasus",
      horseCode: "HRS-002",
      breed: "Arabian",
    },
    ownerId: "u-owner-02",
    owner: {
      id: "u-owner-02",
      fullName: "Minh Vu",
      email: "minh.vu@gmail.com",
      phoneNumber: "0912345678",
    },
    billingPeriod: "2026-09",
    boardingFee: 6000000,
    medicalFee: 800000,
    trainingFee: 4000000,
    prizeCredit: 14000000, // 20M * 0.7 from 2nd place
    netAmount: -3200000,
    status: "PAID",
    createdAt: "2026-09-25T08:00:00Z",
    updatedAt: "2026-09-28T10:00:00Z",
  },
];

export function getStoredInvoices(): FinancialInvoice[] {
  if (typeof window === "undefined") return INITIAL_INVOICES;
  try {
    const raw = localStorage.getItem(FINANCIAL_STORAGE_KEY);
    if (!raw) {
      saveStoredInvoices(INITIAL_INVOICES);
      return INITIAL_INVOICES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_INVOICES;
  }
}

export function saveStoredInvoices(list: FinancialInvoice[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FINANCIAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save invoices", e);
  }
}
