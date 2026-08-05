import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface CurrentUser {
  authenticated: boolean;
  iss: string | null;
  userId: string | null;
  username: string | null;
  name: string | null;
  groups: string[];
  permissions: string[];
  expiresAt: string | null;
}

interface LogoutResponse {
  logoutUrl: string;
}

/**
 * Padrão BFF: o Angular nunca fala OIDC diretamente com o NimbusAuth — só redireciona pro
 * backend (que faz oauth2Login) e faz polling do estado de sessão em /bff/me.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  startLogin(): void {
    window.location.href = `${environment.apiUrl}/bff/login`;
  }

  loadMe(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${environment.apiUrl}/bff/me`);
  }

  logout(): void {
    this.http.post<LogoutResponse>(`${environment.apiUrl}/bff/logout`, {}).subscribe({
      next: (response) => (window.location.href = response.logoutUrl),
      // Se o /bff/logout falhar por qualquer motivo, ainda assim manda pro login em vez de
      // deixar o usuário "preso" numa sessão que pode já estar inválida.
      error: () => this.startLogin(),
    });
  }
}
