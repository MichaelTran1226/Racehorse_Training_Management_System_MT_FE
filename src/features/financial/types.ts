export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface FinancialInvoice {
  id: string;
  horseId: string;
  horse: {
    id: string;
    name: string;
    horseCode?: string | null;
    breed: string;
    avatarUrl?: string | null;
  };
  ownerId: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string | null;
  };
  billingPeriod: string;
  boardingFee: number;
  medicalFee: number;
  trainingFee: number;
  prizeCredit: number;
  netAmount: number;
  status: InvoiceStatus;
  invoiceUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerSummaryResponse {
  totalBoarding: number;
  totalMedical: number;
  totalTraining: number;
  totalExpense: number;
  totalPrizeCredit: number;
  totalNet: number;
  invoiceCount: number;
  invoices: FinancialInvoice[];
}
