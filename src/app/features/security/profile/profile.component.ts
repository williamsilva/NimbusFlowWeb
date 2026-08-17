import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, computed, inject, signal, DestroyRef } from '@angular/core';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';

import { MeStore } from '@core/auth/me.store';
import { BffMeResponse } from '@core/auth/models';
import { AuthService } from '@core/auth/auth.service';
import { I18nService } from '@core/i18n/i18n.service';
import { CsTagComponent, CsTagTone } from '@shared/ui';
import { CsBadgeComponent } from '@shared/ui/badge/cs-badge.component';
import { AccountProfileService, MyProfileModel } from './account-profile.service';
import { PushNotificationService } from '@core/push/push-notification.service';
import {
  UserStatus,
  userStatusLabel,
  UserStatusInput,
  normalizeUserStatus,
} from '@models/enums/user-status.enum';

type ProfileView = {
  authenticated: boolean;
  iss?: string;
  groups: string[];
  userId?: string;
  name?: string;
  username?: string;
  authorities: string[];
  expiresAt?: string;
  userDetails?: MyProfileModel | null;
};

@Component({
  standalone: true,
  selector: 'app-profile-page',
  styleUrl: './profile.component.scss',
  templateUrl: './profile.component.html',
  imports: [
    CommonModule,
    CardModule,
    RouterModule,
    ButtonModule,
    DialogModule,
    DividerModule,
    CsTagComponent,
    TranslateModule,
    CsBadgeComponent,
  ],
})
export class ProfilePageComponent {
  readonly i18n = inject(I18nService);
  private readonly meStore = inject(MeStore);
  private readonly auth = inject(AuthService);
  private readonly accountProfileService = inject(AccountProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pushNotification = inject(PushNotificationService);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly profile = signal<ProfileView | null>(null);

  readonly groupsModalVisible = signal(false);
  readonly permissionsModalVisible = signal(false);

  readonly groups = computed(() => this.profile()?.groups ?? []);
  readonly authorities = computed(() => this.profile()?.authorities ?? []);

  // Opt-in de push notification neste dispositivo/navegador (ver PushNotificationService) -
  // pushSupported some o botão em navegador/contexto sem suporte (ex.: Safari antigo, dev sem
  // service worker registrado); pushSubscribed reflete se JÁ existe uma assinatura ativa.
  readonly pushSupported = signal(false);
  readonly pushSubscribed = signal(false);
  readonly pushBusy = signal(false);
  readonly pushError = signal<string | null>(null);

  openGroupsModal(): void {
    this.groupsModalVisible.set(true);
  }

  openPermissionsModal(): void {
    this.permissionsModalVisible.set(true);
  }

  async togglePush(): Promise<void> {
    this.pushBusy.set(true);
    this.pushError.set(null);
    try {
      if (this.pushSubscribed()) {
        await this.pushNotification.unsubscribe();
        this.pushSubscribed.set(false);
      } else {
        await this.pushNotification.subscribe();
        this.pushSubscribed.set(true);
      }
    } catch {
      this.pushError.set(this.i18n.tUi('profile.push.error' as any, 'Não foi possível ativar as notificações. Tente novamente.'));
    } finally {
      this.pushBusy.set(false);
    }
  }

  constructor() {
    void this.load();
    void this.loadPushState();
  }

  private async loadPushState(): Promise<void> {
    this.pushSupported.set(this.pushNotification.isSupported);
    if (!this.pushNotification.isSupported) {
      return;
    }
    const subscription = await this.pushNotification.currentSubscription();
    this.pushSubscribed.set(!!subscription);
  }

  private async load(): Promise<void> {
    try {
      this.loading.set(true);
      this.loadError.set(null);

      await this.auth.loadMe();

      const me = this.meStore.me() as BffMeResponse | null;

      if (!me) {
        this.profile.set(null);
        this.loadError.set('Erro ao carregar sessão');
        return;
      }

      const baseProfile: ProfileView = {
        authenticated: me.authenticated ?? false,
        iss: me.iss ?? '',
        groups: me.groups ?? [],
        userId: me.userId ?? '',
        name: me.name ?? '',
        username: me.username ?? '',
        authorities: me.permissions ?? [],
        expiresAt: me.expiresAt ?? '',
        userDetails: null,
      };

      this.profile.set(baseProfile);

      // Self-service (GET /bff/v1/me/profile) - nunca exige USERS_CONSULT, ao contrário da rota
      // administrativa "ver qualquer usuário" (UsersFacade.getById), que era usada aqui antes e
      // bloqueava um usuário comum de ver o próprio perfil.
      this.accountProfileService
        .getMyProfile()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (details) => {
            this.profile.update((current) =>
              current ? { ...current, userDetails: details } : current,
            );
          },
          error: () => {
            this.profile.update((current) =>
              current ? { ...current, userDetails: null } : current,
            );
          },
        });
    } finally {
      this.loading.set(false);
    }
  }

  initials(value?: string): string {
    const text = (value || '').trim();
    if (!text) return '?';

    const parts = text.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  sortedGroups(values?: string[] | null): string[] {
    return [...(values ?? [])].sort();
  }

  sortedAuthorities(values?: string[] | null): string[] {
    return [...(values ?? [])].sort();
  }

  fmtValue(value?: string | number | null): string {
    if (!value) return '—';
    return String(value);
  }

  fmtDateTime(value?: string | Date | null): string {
    if (!value) return '—';

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';

    return new Intl.DateTimeFormat(this.i18n.getLocale(), {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(d);
  }

  documentMask(value?: string | null): string {
    const raw = (value ?? '').replace(/\D/g, '');
    if (!raw) return '—';

    if (raw.length === 11) {
      return raw.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    if (raw.length === 14) {
      return raw.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    return value ?? '—';
  }

  statusLabel(status?: UserStatusInput): string {
    return userStatusLabel(status, this.i18n);
  }

  statusSeverity(status?: UserStatusInput): CsTagTone {
    switch (normalizeUserStatus(status)) {
      case UserStatus.ACTIVE:
        return 'success';
      case UserStatus.PENDING_PASSWORD:
        return 'info';
      case UserStatus.BLOCKED:
        return 'warn';
      case UserStatus.INACTIVE:
      case UserStatus.DISABLED:
        return 'danger';
      default:
        return 'contrast';
    }
  }

  blockedStateLabel(blockedUntil?: string | Date | null): string {
    const yes = this.i18n.tUi('common.yes' as any, 'Sim');
    const no = this.i18n.tUi('common.no' as any, 'Não');

    if (!blockedUntil) return no;

    const d = new Date(blockedUntil);
    if (Number.isNaN(d.getTime())) return no;

    return d.getTime() > Date.now() ? yes : no;
  }

  passwordExpiryLabel(passwordExpiresAt?: string | Date | null): string {
    if (!passwordExpiresAt) {
      return this.i18n.tUi('profile.password.notInformed' as any, 'Não informado');
    }

    const d = new Date(passwordExpiresAt);
    if (Number.isNaN(d.getTime())) {
      return this.i18n.tUi('profile.password.notInformed' as any, 'Não informado');
    }

    const diff = d.getTime() - Date.now();

    if (diff <= 0) {
      return this.i18n.tUi('profile.password.expired' as any, 'Expirada');
    }

    const days = Math.floor(diff / 86400000);

    if (days <= 0) {
      return this.i18n.tUi('profile.password.today' as any, 'Hoje');
    }

    if (days === 1) {
      return `1 ${this.i18n.tUi('profile.password.day' as any, 'dia')}`;
    }

    return `${days} ${this.i18n.tUi('profile.password.days' as any, 'dias')}`;
  }

  /** Realça cada permissão pela cor já usada no menu lateral pra mesma área da tela
   * (ex.: Conciliação é roxo, Cadastros é laranja, Ajustes é âmbar — ver menu.data.ts). */
  permissionClass(permission?: string | null): string {
    const v = (permission ?? '').toUpperCase();

    if (v === 'SUPPORT') return 'is-support';

    if (v.startsWith('BANK_STATEMENT')) return 'is-perm-bank-statement';

    if (
      v.startsWith('CONTRACT_AUDIT') ||
      v.startsWith('CONCILIATION_') ||
      v.startsWith('MANUAL_BANK_RECONCILIATION') ||
      v.startsWith('BANK_ACQUIRER_CONCILIATION') ||
      v.startsWith('FINANCIAL_RECONCILIATION_PIPELINE')
    ) {
      return 'is-perm-conciliation';
    }

    if (v.startsWith('ADJUSTMENT_') || v.startsWith('CHARGEBACK_ANALYSIS')) {
      return 'is-perm-adjustment';
    }

    if (v.startsWith('ERP_SALES') || v.startsWith('ERP_INSTALLMENTS')) {
      return 'is-perm-erp';
    }

    if (
      v.startsWith('ACQUIRERS_SALES') ||
      v.startsWith('ACQUIRERS_INSTALLMENTS') ||
      v.startsWith('ANTICIPATION') ||
      v.startsWith('SALES_SUMMARY') ||
      v.startsWith('CREDIT_ORDER')
    ) {
      return 'is-perm-acq';
    }

    if (v.startsWith('USERS') || v.startsWith('GROUP')) return 'is-perm-security';

    if (v.startsWith('FILE_PROCESSING')) return 'is-perm-file-processing';

    if (
      v.startsWith('SCHEDULER_SETTINGS') ||
      v.startsWith('EMAIL_SETTINGS') ||
      v.startsWith('RECONCILIATION_SETTINGS')
    ) {
      return 'is-perm-settings';
    }

    if (v.startsWith('AUDIT_MAIL')) return 'is-perm-audit';

    if (v.startsWith('MANAGEMENT_DASHBOARD') || v.startsWith('DASHBOARD_AUDIT')) {
      return 'is-perm-dashboard';
    }

    if (
      v.startsWith('COMPANIES') ||
      v.startsWith('ACQUIRER_') ||
      v.startsWith('ESTABLISHMENT') ||
      v.startsWith('FLAGS') ||
      v.startsWith('CONTRACTS') ||
      v.startsWith('HOLIDAYS') ||
      v.startsWith('BANK_') ||
      v.startsWith('BANKING_DOMICILE') ||
      v.startsWith('NO_FILE_DAY')
    ) {
      return 'is-perm-cadastros';
    }

    return 'is-default';
  }

  /**
   * Sem entrada em profile.permissionDescription (ex.: permissão nova ainda não traduzida) cai
   * pro mesmo fallback humanizado de groupLabel - antes retornava '' e o chip da permissão ficava
   * só com o número, sem nome nenhum (bug que já tinha ocorrido no CardSync por esse mesmo motivo).
   */
  permissionDescription(permission?: string | null): string {
    const value = (permission ?? '').trim().toUpperCase();
    if (!value) return '';

    return this.i18n.tUi(`profile.permissionDescription.${value}` as any, this.humanizeEnum(value));
  }

  groupLabel(group?: string | null): string {
    const value = (group ?? '').trim().toUpperCase();
    if (!value) return '—';

    const translated = this.i18n.tUi(`profile.group.${value}` as any, this.humanizeEnum(value));

    return translated;
  }

  groupClass(group?: string | null): string {
    const v = (group ?? '').toUpperCase();
    if (v === 'SUPPORT') return 'is-support';
    return 'is-groups';
  }

  private humanizeEnum(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((p) => p[0].toUpperCase() + p.slice(1))
      .join(' ');
  }
}
