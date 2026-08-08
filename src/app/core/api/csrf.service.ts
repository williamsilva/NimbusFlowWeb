import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { firstValueFrom } from 'rxjs';

import { API } from './api.config';

@Injectable({ providedIn: 'root' })
export class CsrfService {
  constructor(private http: HttpClient) {}

  async ensureCsrfCookie(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.get(`${API.bff}/csrf`, {
          withCredentials: true,
          responseType: 'text',
        }),
      );
    } catch {
      // ignora: o fluxo de login/logout não deve quebrar por falha ao tocar o endpoint de CSRF
    }
  }

  getXsrfTokenFromCookie(): string | null {
    // Nome distinto do padrão "XSRF-TOKEN" - evita colisão de cookie com outros apps Nimbus no
    // mesmo domínio "localhost" (ver SecurityConfig.csrfTokenRepository no NimbusFlowServer).
    const match = document.cookie.match(/(?:^|;\s*)NIMBUSFLOW-XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
}
