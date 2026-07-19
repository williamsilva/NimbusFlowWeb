import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type AddendumStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ApprovalTier = 'TIER1' | 'TIER2';

export interface Addendum {
  id: string;
  workId: string;
  amount: number;
  justification: string;
  status: AddendumStatus;
  requiredTier: ApprovalTier;
  requestedById: string;
  approvedById: string | null;
  decisionDate: string | null;
  decisionNote: string | null;
  supersedesId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddendumRequest {
  amount: number;
  justification: string;
  supersedesId: string | null;
}

export interface AddendumDecisionRequest {
  decisionNote: string | null;
}

@Injectable({ providedIn: 'root' })
export class AddendumService {
  constructor(private readonly http: HttpClient) {}

  listByWork(workId: string): Observable<Addendum[]> {
    return this.http.get<Addendum[]>(`${environment.apiUrl}/bff/v1/works/${workId}/addendums`);
  }

  submit(workId: string, request: AddendumRequest): Observable<Addendum> {
    return this.http.post<Addendum>(`${environment.apiUrl}/bff/v1/works/${workId}/addendums`, request);
  }

  approve(id: string, request: AddendumDecisionRequest): Observable<Addendum> {
    return this.http.post<Addendum>(`${environment.apiUrl}/bff/v1/addendums/${id}/approve`, request);
  }

  reject(id: string, request: AddendumDecisionRequest): Observable<Addendum> {
    return this.http.post<Addendum>(`${environment.apiUrl}/bff/v1/addendums/${id}/reject`, request);
  }
}
