import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type InstallmentStatus = 'PLANNED' | 'MEASUREMENT_SUBMITTED' | 'MEASUREMENT_APPROVED' | 'RELEASED' | 'PAID';

export interface Installment {
  id: string;
  workId: string;
  number: number;
  amount: number;
  dueDate: string;
  status: InstallmentStatus;
  releasedById: string | null;
  releasedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentScheduleItem {
  amount: number;
  dueDate: string;
}

export interface InstallmentScheduleRequest {
  installments: InstallmentScheduleItem[];
}

@Injectable({ providedIn: 'root' })
export class InstallmentService {
  constructor(private readonly http: HttpClient) {}

  listByWork(workId: string): Observable<Installment[]> {
    return this.http.get<Installment[]>(`${environment.apiUrl}/bff/v1/works/${workId}/installments`);
  }

  schedule(workId: string, request: InstallmentScheduleRequest): Observable<Installment[]> {
    return this.http.post<Installment[]>(`${environment.apiUrl}/bff/v1/works/${workId}/installments`, request);
  }

  release(id: string): Observable<Installment> {
    return this.http.post<Installment>(`${environment.apiUrl}/bff/v1/installments/${id}/release`, {});
  }

  markAsPaid(id: string): Observable<Installment> {
    return this.http.post<Installment>(`${environment.apiUrl}/bff/v1/installments/${id}/mark-paid`, {});
  }
}
