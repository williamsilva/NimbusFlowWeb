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
    // /bff/** (sessão), não /api/** (JWT bearer) - essa tela é self-service autenticado por
    // cookie de sessão; BffAccountController expõe exatamente isso em /bff/v1/password-policy.
    return this.http.get<PasswordRulesViewModel>(`${API.bff}/v1/password-policy`, {
      withCredentials: true,
    });
  }

  checkPolicy(payload: PasswordCheckRequest): Observable<PasswordRulesViewModel> {
    return this.http.post<PasswordRulesViewModel>(`${API.bff}/v1/password-policy/check`, payload, {
      withCredentials: true,
    });
  }

  changeMyPassword(payload: ChangeMyPasswordRequest): Observable<void> {
    // BffAccountController mapeia PUT /bff/v1/me/password (sem "/change" no final) - o "/change"
    // só existe no lado NimbusAuth (NimbusAuthClient chama /api/v1/me/password/change lá), não
    // aqui no BFF do NimbusFlowServer.
    return this.http.put<void>(`${API.bff}/v1/me/password`, payload, {
      withCredentials: true,
    });
  }
}
