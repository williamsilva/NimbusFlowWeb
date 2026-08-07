import { Injectable, computed, signal } from '@angular/core';

import { CurrentUser } from './auth.service';

/** Mesmo padrão do CardSyncWeb (core/auth/me.store.ts) - cache compartilhado do /bff/me, alimentado
 * uma única vez pelo AppComponent, consumido por PermissionService e qualquer outro lugar que
 * precise saber quem está logado sem re-chamar /bff/me. */
@Injectable({ providedIn: 'root' })
export class MeStore {
  private readonly _me = signal<CurrentUser | null>(null);

  readonly me = this._me.asReadonly();
  readonly isAuthenticatedSignal = computed(() => this._me()?.authenticated === true);

  setMe(me: CurrentUser | null): void {
    this._me.set(me);
  }

  isAuthenticated(): boolean {
    return this._me()?.authenticated === true;
  }
}
