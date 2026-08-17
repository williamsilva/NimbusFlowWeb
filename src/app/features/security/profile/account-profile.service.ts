import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { API } from '@core/api/api.config';

/** Espelha com.nimbusflow.common.security.bff.ProfileResponse - status vem cru (Integer), mesmo
 *  formato que normalizeUserStatus já aceita direto (UserStatusInput inclui number). */
export interface MyProfileModel {
  id: string;
  name: string;
  userName: string;
  document: string;
  status: number | null;
  createdAt: string | null;
  lastLoginAt: string | null;
  blockedUntil: string | null;
  passwordExpiresAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class AccountProfileService {
  private readonly http = inject(HttpClient);

  /** Perfil do próprio usuário autenticado - self-service (resolvido pelo backend por identidade
   *  do token, sem parâmetro de id), nunca exige USERS_CONSULT. Diferente de
   *  UsersApiService.getById, que é a rota administrativa "ver qualquer usuário" e por isso é
   *  bloqueada pra quem não gerencia usuários - ver BffAccountController#getMyProfile no
   *  NimbusFlowServer / MeProfileController no NimbusAuth. */
  getMyProfile(): Observable<MyProfileModel> {
    return this.http.get<MyProfileModel>(`${API.bff}/v1/me/profile`, { withCredentials: true });
  }
}
