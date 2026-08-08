import { Injectable, computed, signal } from '@angular/core';

import { BffMeResponse } from './models';

@Injectable({ providedIn: 'root' })
export class MeStore {
  private readonly _me = signal<BffMeResponse | null>(null);

  readonly me = this._me.asReadonly();
  readonly isAuthenticatedSignal = computed(() => this._me() != null);

  setMe(me: BffMeResponse | null): void {
    this._me.set(me);
  }

  isAuthenticated(): boolean {
    return this._me() != null;
  }
}
