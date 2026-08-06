import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { GroupRef } from './group.service';

/** 1=Ativo 2=Inativo 3=Bloqueado 4=Desativado 5=Senha pendente (StatusUserEnum do NimbusAuth) -
 *  mesmo enum de account.service.ts (Profile.status), reaproveita as chaves account.profile.status*. */
export interface AdminUser {
  id: string;
  name: string;
  userName: string;
  document: string;
  status: number;
  createdAt: string;
  lastLoginAt: string | null;
  blockedUntil: string | null;
  passwordExpiresAt: string | null;
  createdBy: string | null;
  /** Só os grupos do NimbusFlow - ver AdminUserService no backend (usuário pode ter outros grupos
   *  de outros apps Nimbus, não expostos aqui). */
  groups: GroupRef[];
}

export interface AdminUserRequest {
  userName: string;
  name: string;
  document: string;
  groupIds: string[];
}

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly baseUrl = `${environment.apiUrl}/bff/v1/users`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.baseUrl);
  }

  create(request: AdminUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.baseUrl, request);
  }

  update(id: string, request: AdminUserRequest): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.baseUrl}/${id}`, request);
  }

  activate(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/activate`, {});
  }

  deactivate(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/deactivate`, {});
  }

  resendInvite(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/resend-invite`, {});
  }
}
