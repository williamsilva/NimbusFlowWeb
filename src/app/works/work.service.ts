import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type WorkStatus = 'PLANNED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface Work {
  id: string;
  name: string;
  supplierId: string;
  supplierName: string;
  ownerId: string;
  approvedById: string | null;
  approvedAt: string | null;
  startDate: string;
  expectedEndDate: string;
  actualEndDate: string | null;
  initialAmount: number;
  totalAmount: number;
  status: WorkStatus;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkRequest {
  name: string;
  supplierId: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate: string | null;
  initialAmount: number;
  latitude: number;
  longitude: number;
  status: WorkStatus | null;
}

@Injectable({ providedIn: 'root' })
export class WorkService {
  private readonly baseUrl = `${environment.apiUrl}/bff/v1/works`;

  constructor(private readonly http: HttpClient) {}

  /** status opcional - usado pelo mapa de obras do dashboard (Fase 6) pra filtrar por status. */
  list(status?: WorkStatus): Observable<Work[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<Work[]>(this.baseUrl, { params });
  }

  get(id: string): Observable<Work> {
    return this.http.get<Work>(`${this.baseUrl}/${id}`);
  }

  create(request: WorkRequest): Observable<Work> {
    return this.http.post<Work>(this.baseUrl, request);
  }

  update(id: string, request: WorkRequest): Observable<Work> {
    return this.http.put<Work>(`${this.baseUrl}/${id}`, request);
  }
}
