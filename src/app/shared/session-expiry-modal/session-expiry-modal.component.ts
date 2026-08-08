
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../core/auth/auth.service';
import { SessionService } from '../../core/auth/session.service';

@Component({
  standalone: true,
  selector: 'cs-session-expiry-modal',
  templateUrl: './sesseion-expiry-modal.html',
  styleUrls: ['./sesseion-expiry-modal.scss'],
  imports: [DialogModule, ButtonModule, TranslateModule],
})
export class SessionExpiryModalComponent {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly session = inject(SessionService);

  visible = false;
  renewing = signal(false);

  private dismissUntilMs = 0;
  private lastInteractionAtMs = Date.now();
  private expiredAutoCloseId: number | null = null;

  private readonly dismissCooldownMs = 20_000;
  private readonly autoCloseAfterMs = 60_000;

  readonly expired = computed(() => this.session.isExpired());

  readonly state = computed<'normal' | 'warning' | 'danger' | 'expired'>(() => {
    if (this.expired()) return 'expired';

    const s = this.session.remainingSeconds();
    if (s == null) return 'normal';
    if (s <= 120) return 'danger';
    if (s <= 300) return 'warning';

    return 'normal';
  });

  readonly timeBlink = computed(() => {
    const state = this.state();
    return state === 'warning' || state === 'danger';
  });

  readonly mmss = computed(() => {
    const s = this.session.remainingSeconds();
    if (s == null) return '--:--';

    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, '0');

    return `${mm}:${ss}`;
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.clearAutoClose());

    effect(() => {
      const remaining = this.session.remainingSeconds();
      const expiring = this.session.isExpiringSoon();
      const expired = this.session.isExpired();
      const now = Date.now();

      // sem sessão ou sessão já sincronizada/renovada em outra aba
      if (remaining == null || (!expiring && !expired)) {
        this.visible = false;
        this.dismissUntilMs = 0;
        this.clearAutoClose();
        return;
      }

      // se a sessão foi renovada em outra aba enquanto este modal estava aberto
      if (!expired) {
        this.clearAutoClose();
      }

      // respeita "Agora não" enquanto ainda estiver na mesma janela de risco
      if (!expired && now < this.dismissUntilMs) {
        return;
      }

      // mostra quando estiver expirada ou perto de expirar
      if ((expiring || expired) && !this.visible) {
        this.visible = true;
        this.lastInteractionAtMs = now;
      }

      // expirou de fato: agenda auto-close inteligente
      if (expired && this.visible) {
        this.scheduleAutoClose();
      }
    });
  }

  dismiss(): void {
    this.visible = false;
    this.lastInteractionAtMs = Date.now();
    this.dismissUntilMs = Date.now() + this.dismissCooldownMs;
    this.clearAutoClose();
  }

  async renew(): Promise<void> {
    this.renewing.set(true);
    try {
      const ok = await this.auth.renewSession();

      // com SessionService sincronizado, outra aba também receberá o novo expiresAt
      if (ok) {
        this.visible = false;
        this.dismissUntilMs = 0;
        this.clearAutoClose();
      }
    } finally {
      this.renewing.set(false);
    }
  }

  async goLogin(): Promise<void> {
    this.visible = false;
    this.clearAutoClose();
    await this.auth.startLogin();
  }

  touchInteraction(): void {
    this.lastInteractionAtMs = Date.now();

    if (this.session.isExpired() && this.visible) {
      this.scheduleAutoClose();
    }
  }

  private scheduleAutoClose(): void {
    this.clearAutoClose();

    const elapsed = Date.now() - this.lastInteractionAtMs;
    const remaining = Math.max(0, this.autoCloseAfterMs - elapsed);

    this.expiredAutoCloseId = window.setTimeout(() => {
      this.expiredAutoCloseId = null;

      const stillExpired = this.session.isExpired();
      const idleMs = Date.now() - this.lastInteractionAtMs;

      if (!stillExpired) {
        this.visible = false;
        this.clearAutoClose();
        return;
      }

      if (idleMs >= this.autoCloseAfterMs) {
        this.visible = false;
        return;
      }

      if (this.visible) {
        this.scheduleAutoClose();
      }
    }, remaining);
  }

  private clearAutoClose(): void {
    if (this.expiredAutoCloseId != null) {
      window.clearTimeout(this.expiredAutoCloseId);
      this.expiredAutoCloseId = null;
    }
  }
}
