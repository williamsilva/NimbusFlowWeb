import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Profile {
  id: string;
  name: string;
  userName: string;
  document: string | null;
  /** 1=Ativo 2=Inativo 3=Bloqueado 4=Desativado 5=Senha pendente (StatusUserEnum do NimbusAuth). */
  status: number;
  createdAt: string;
  lastLoginAt: string | null;
  blockedUntil: string | null;
  passwordExpiresAt: string | null;
}

export interface PasswordRule {
  code: string;
  /** Label já vem do NimbusAuth em português - a tela usa passwordRule.<code> (i18n) em vez desta,
   *  pra não depender do backend pra ter EN/ES (ver PROJECT_SPEC/decisão da Fase de i18n). */
  label: string;
  state: 'OK' | 'FAIL' | 'PENDING';
}

export interface PasswordPolicy {
  ok: boolean;
  minLen: number;
  historySize: number;
  rules: PasswordRule[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly baseUrl = `${environment.apiUrl}/bff/v1`;

  constructor(private readonly http: HttpClient) {}

  getMyProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${this.baseUrl}/me/profile`);
  }

  getPasswordPolicy(): Observable<PasswordPolicy> {
    return this.http.get<PasswordPolicy>(`${this.baseUrl}/password-policy`);
  }

  checkPasswordPolicy(password: string, confirmPassword: string): Observable<PasswordPolicy> {
    return this.http.post<PasswordPolicy>(`${this.baseUrl}/password-policy/check`, { password, confirmPassword });
  }

  changeMyPassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/me/password`, request);
  }
}
