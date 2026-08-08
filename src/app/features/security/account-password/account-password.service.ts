import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { API } from '@core/api/api.config';

export type PasswordRuleServerState = 'OK' | 'FAIL' | 'PENDING';

export interface PasswordRuleViewDto {
  code: string;
  label: string;
  state: PasswordRuleServerState;
}

export interface PasswordRulesViewModel {
  ok: boolean;
  minLen: number;
  historySize: number;
  rules: PasswordRuleViewDto[];
}

export interface PasswordCheckRequest {
  password: string;
  confirmPassword?: string | null;
  username?: string | null;
}

export interface ChangeMyPasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AccountPasswordService {
  private readonly http = inject(HttpClient);

  loadPolicy(): Observable<PasswordRulesViewModel> {
    return this.http.get<PasswordRulesViewModel>(`${API.api}/password/policy`, {
      withCredentials: true,
    });
  }

  checkPolicy(payload: PasswordCheckRequest): Observable<PasswordRulesViewModel> {
    return this.http.post<PasswordRulesViewModel>(`${API.api}/password/policy/check`, payload, {
      withCredentials: true,
    });
  }

  changeMyPassword(payload: ChangeMyPasswordRequest): Observable<void> {
    return this.http.put<void>(`${API.bff}/v1/me/password/change`, payload, {
      withCredentials: true,
    });
  }
}
