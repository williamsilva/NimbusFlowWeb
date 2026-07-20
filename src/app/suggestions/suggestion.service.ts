import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type SuggestionStatus = 'RECEIVED' | 'IN_ANALYSIS' | 'IMPLEMENTED' | 'REJECTED';

export interface Suggestion {
  id: string;
  createdById: string;
  description: string;
  status: SuggestionStatus;
  attachmentUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionRequest {
  description: string;
}

export interface SuggestionStatusRequest {
  status: SuggestionStatus;
}

@Injectable({ providedIn: 'root' })
export class SuggestionService {
  private readonly baseUrl = `${environment.apiUrl}/bff/v1/suggestions`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Suggestion[]> {
    return this.http.get<Suggestion[]>(this.baseUrl);
  }

  create(request: SuggestionRequest, attachment: File | null): Observable<Suggestion> {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (attachment) {
      formData.append('attachment', attachment);
    }
    return this.http.post<Suggestion>(this.baseUrl, formData);
  }

  updateStatus(id: string, request: SuggestionStatusRequest): Observable<Suggestion> {
    return this.http.put<Suggestion>(`${this.baseUrl}/${id}/status`, request);
  }
}
