export type SeverityLevel = 'MILD' | 'MODERATE' | 'CRITICAL';
export type IncidentSeverity = SeverityLevel;

export type IncidentStatus = 'REPORTED' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface IncidentReport {
  id: string;
  incidentNumber?: string;
  horseId: string;
  horse?: {
    id: string;
    name: string;
    horseCode?: string;
    avatarUrl?: string;
    status: string;
    isMedicalLocked: boolean;
    stallAllocations?: Array<{
      stall?: { code: string; zone: string };
    }>;
  };
  stallZoneId?: string;
  stallZone?: {
    id: string;
    code: string;
    name: string;
  };
  reportedById: string;
  reportedBy?: {
    id: string;
    fullName: string;
    role: string;
  };
  severity: SeverityLevel;
  symptomsJson: string[];
  description: string;
  status: IncidentStatus;
  vetNotes?: string | null;
  reviewedById?: string | null;
  reviewedBy?: {
    id: string;
    fullName: string;
    role: string;
  } | null;
  reviewedAt?: string | null;
  medicalRecordId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentPayload {
  horseId: string;
  stallZoneId?: string;
  severity: SeverityLevel;
  symptoms?: string[];
  symptomsJson?: string[];
  description: string;
}

export interface ReviewIncidentPayload {
  status: IncidentStatus;
  vetNotes?: string;
}

export interface QueryIncidentsFilter {
  horseId?: string;
  zoneId?: string;
  severity?: SeverityLevel;
  status?: IncidentStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IncidentsListResponse {
  items: IncidentReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
