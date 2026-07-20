import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type MeasurementStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MediaType = 'PHOTO' | 'VIDEO';

export interface MeasurementMedia {
  id: string;
  type: MediaType;
  url: string;
}

export interface Measurement {
  id: string;
  installmentId: string;
  description: string;
  status: MeasurementStatus;
  latitude: number;
  longitude: number;
  distanceFromWorkMeters: number | null;
  submittedById: string;
  submittedAt: string;
  approvedById: string | null;
  decisionDate: string | null;
  decisionNote: string | null;
  supersedesId: string | null;
  media: MeasurementMedia[];
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementRequest {
  description: string;
  latitude: number;
  longitude: number;
  supersedesId: string | null;
}

export interface MeasurementDecisionRequest {
  decisionNote: string | null;
}

@Injectable({ providedIn: 'root' })
export class MeasurementService {
  constructor(private readonly http: HttpClient) {}

  listByInstallment(installmentId: string): Observable<Measurement[]> {
    return this.http.get<Measurement[]>(`${environment.apiUrl}/bff/v1/installments/${installmentId}/measurements`);
  }

  submit(installmentId: string, request: MeasurementRequest, files: File[]): Observable<Measurement> {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    files.forEach((file) => formData.append('files', file));
    return this.http.post<Measurement>(`${environment.apiUrl}/bff/v1/installments/${installmentId}/measurements`, formData);
  }

  approve(id: string, request: MeasurementDecisionRequest): Observable<Measurement> {
    return this.http.post<Measurement>(`${environment.apiUrl}/bff/v1/measurements/${id}/approve`, request);
  }

  reject(id: string, request: MeasurementDecisionRequest): Observable<Measurement> {
    return this.http.post<Measurement>(`${environment.apiUrl}/bff/v1/measurements/${id}/reject`, request);
  }
}
