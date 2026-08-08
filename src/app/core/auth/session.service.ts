import { Injectable, computed, signal } from '@angular/core';

type SessionSyncMessage =
  | { type: 'session-start'; expiresAtIso: string | null; origin: string; at: number }
  | { type: 'session-stop'; origin: string; at: number };

@Injectable({ providedIn: 'root' })
export class SessionService {
  private static readonly EXPIRES_AT_KEY = 'nimbusflow-security.session.expiresAt';
  private static readonly EVENT_KEY = 'nimbusflow-security.session.event';
  private static readonly CHANNEL_NAME = 'nimbusflow-security-session';
  private static readonly LOGIN_REDIRECT_LOCK_KEY = 'nfs_login_redirect_lock';

  private readonly tabId = this.createTabId();

  private readonly expiresAt = signal<Date | null>(null);
  private timerId: number | null = null;

  private readonly channel: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined'
      ? new BroadcastChannel(SessionService.CHANNEL_NAME)
      : null;

  readonly remainingSeconds = signal<number | null>(null);

  readonly warnAtSeconds = signal<number>(300);
  readonly autoLogoutAtZero = signal<boolean>(true);

  readonly isExpiringSoon = computed(() => {
    const s = this.remainingSeconds();
    const warn = this.warnAtSeconds();
    return s !== null && s > 0 && s <= warn;
  });

  readonly isExpired = computed(() => {
    const s = this.remainingSeconds();
    return s !== null && s <= 0;
  });

  constructor() {
    this.hydrateFromStorage();
    this.bindStorageListener();
    this.bindBroadcastChannel();
    this.bindVisibilitySync();
  }

  start(expiresAtIso: string | null): void {
    this.applySession(expiresAtIso, true);
  }

  stop(): void {
    this.clearSession(true);
  }

  private applySession(expiresAtIso: string | null, syncAcrossTabs: boolean): void {
    this.stopTimer();

    if (!expiresAtIso) {
      this.expiresAt.set(null);
      this.remainingSeconds.set(null);
      this.clearLoginRedirectLock();

      if (syncAcrossTabs) {
        this.removeSharedExpiresAt();
        this.broadcast({
          type: 'session-stop',
          origin: this.tabId,
          at: Date.now(),
        });
      }
      return;
    }

    const exp = new Date(expiresAtIso);
    if (Number.isNaN(exp.getTime())) {
      this.expiresAt.set(null);
      this.remainingSeconds.set(null);
      this.clearLoginRedirectLock();

      if (syncAcrossTabs) {
        this.removeSharedExpiresAt();
        this.broadcast({
          type: 'session-stop',
          origin: this.tabId,
          at: Date.now(),
        });
      }
      return;
    }

    this.expiresAt.set(exp);
    this.tick();
    this.timerId = window.setInterval(() => this.tick(), 1000);

    if (syncAcrossTabs) {
      this.saveSharedExpiresAt(expiresAtIso);
      this.broadcast({
        type: 'session-start',
        expiresAtIso,
        origin: this.tabId,
        at: Date.now(),
      });
    }
  }

  private clearSession(syncAcrossTabs: boolean): void {
    this.stopTimer();
    this.expiresAt.set(null);
    this.remainingSeconds.set(null);
    this.clearLoginRedirectLock();

    if (syncAcrossTabs) {
      this.removeSharedExpiresAt();
      this.broadcast({
        type: 'session-stop',
        origin: this.tabId,
        at: Date.now(),
      });
    }
  }

  private tick(): void {
    const exp = this.expiresAt();
    if (!exp) {
      this.remainingSeconds.set(null);
      return;
    }

    const diffMs = exp.getTime() - Date.now();
    const diffSec = Math.max(0, Math.ceil(diffMs / 1000));

    this.remainingSeconds.set(diffSec);
  }

  private stopTimer(): void {
    if (this.timerId != null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private hydrateFromStorage(): void {
    const expiresAtIso = localStorage.getItem(SessionService.EXPIRES_AT_KEY);

    if (!expiresAtIso) {
      this.clearSession(false);
      return;
    }

    this.applySession(expiresAtIso, false);
  }

  private bindStorageListener(): void {
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === SessionService.EXPIRES_AT_KEY) {
        if (!event.newValue) {
          this.clearSession(false);
          return;
        }

        this.applySession(event.newValue, false);
        return;
      }

      if (event.key === SessionService.EVENT_KEY && event.newValue) {
        try {
          const msg = JSON.parse(event.newValue) as SessionSyncMessage;

          if (msg.origin === this.tabId) {
            return;
          }

          if (msg.type === 'session-stop') {
            this.clearSession(false);
            return;
          }

          if (msg.type === 'session-start') {
            this.applySession(msg.expiresAtIso, false);
          }
        } catch {
          // ignora payload inválido
        }
      }
    });
  }

  private bindBroadcastChannel(): void {
    if (!this.channel) return;

    this.channel.onmessage = (event: MessageEvent<SessionSyncMessage>) => {
      const msg = event.data;

      if (!msg || msg.origin === this.tabId) {
        return;
      }

      if (msg.type === 'session-stop') {
        this.clearSession(false);
        return;
      }

      if (msg.type === 'session-start') {
        this.applySession(msg.expiresAtIso, false);
      }
    };
  }

  private bindVisibilitySync(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;

      const sharedExpiresAt = localStorage.getItem(SessionService.EXPIRES_AT_KEY);

      if (!sharedExpiresAt) {
        this.clearSession(false);
        return;
      }

      const localExpiresAt = this.expiresAt()?.toISOString() ?? null;

      if (localExpiresAt !== sharedExpiresAt) {
        this.applySession(sharedExpiresAt, false);
      } else {
        this.tick();
      }
    });
  }

  private saveSharedExpiresAt(expiresAtIso: string): void {
    localStorage.setItem(SessionService.EXPIRES_AT_KEY, expiresAtIso);
    localStorage.setItem(
      SessionService.EVENT_KEY,
      JSON.stringify({
        type: 'session-start',
        expiresAtIso,
        origin: this.tabId,
        at: Date.now(),
      } satisfies SessionSyncMessage),
    );
  }

  private removeSharedExpiresAt(): void {
    localStorage.removeItem(SessionService.EXPIRES_AT_KEY);
    localStorage.setItem(
      SessionService.EVENT_KEY,
      JSON.stringify({
        type: 'session-stop',
        origin: this.tabId,
        at: Date.now(),
      } satisfies SessionSyncMessage),
    );
  }

  private clearLoginRedirectLock(): void {
    // localStorage (não sessionStorage) - o lock em auth-redirect.interceptor.ts é compartilhado
    // entre abas via localStorage; precisa limpar do mesmo lugar.
    localStorage.removeItem(SessionService.LOGIN_REDIRECT_LOCK_KEY);
  }

  private broadcast(msg: SessionSyncMessage): void {
    try {
      this.channel?.postMessage(msg);
    } catch {
      // ignora falha do canal
    }
  }

  private createTabId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
