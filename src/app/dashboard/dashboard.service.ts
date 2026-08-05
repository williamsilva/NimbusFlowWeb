import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Work, WorkStatus } from '../works/work.service';

export interface DashboardSummary {
  totalContracted: number;
  totalPaid: number;
  totalBalance: number;
  totalInitialAmount: number;
  addendumIncreasePercentage: number;
  worksByStatus: Partial<Record<WorkStatus, number>>;
  overdueWorksCount: number;
  pendingAddendumsCount: number;
  pendingMeasurementsCount: number;
}

export interface SupplierRanking {
  supplierId: string;
  supplierName: string;
  totalContracted: number;
  totalPaid: number;
}

export interface PendingAddendum {
  id: string;
  workId: string;
  workName: string;
  amount: number;
  justification: string;
  requiredTier: 'TIER1' | 'TIER2';
  requestedById: string;
  createdAt: string;
}

export interface PendingMeasurement {
  id: string;
  installmentId: string;
  installmentNumber: number;
  workId: string;
  workName: string;
  description: string;
  submittedById: string;
  submittedAt: string;
}

export interface PendingApprovals {
  addendums: PendingAddendum[];
  measurements: PendingMeasurement[];
}

export type TimelineEventType =
  | 'WORK_STARTED'
  | 'WORK_COMPLETED'
  | 'ADDENDUM_REQUESTED'
  | 'ADDENDUM_APPROVED'
  | 'ADDENDUM_REJECTED'
  | 'MEASUREMENT_SUBMITTED'
  | 'MEASUREMENT_APPROVED'
  | 'MEASUREMENT_REJECTED'
  | 'INSTALLMENT_RELEASED'
  | 'INSTALLMENT_PAID';

export interface WorkTimelineEvent {
  occurredAt: string;
  type: TimelineEventType;
  description: string;
  amount: number | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = `${environment.apiUrl}/bff/v1/dashboard`;

  constructor(private readonly http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.baseUrl}/summary`);
  }

  getOverdueWorks(): Observable<Work[]> {
    return this.http.get<Work[]>(`${this.baseUrl}/overdue-works`);
  }

  getPendingApprovals(): Observable<PendingApprovals> {
    return this.http.get<PendingApprovals>(`${this.baseUrl}/pending-approvals`);
  }

  getSupplierRanking(): Observable<SupplierRanking[]> {
    return this.http.get<SupplierRanking[]>(`${this.baseUrl}/supplier-ranking`);
  }

  getWorkTimeline(workId: string): Observable<WorkTimelineEvent[]> {
    return this.http.get<WorkTimelineEvent[]>(`${this.baseUrl}/works/${workId}/timeline`);
  }

  exportPdf(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/pdf`, { responseType: 'blob' });
  }

  exportExcel(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/excel`, { responseType: 'blob' });
  }
}
