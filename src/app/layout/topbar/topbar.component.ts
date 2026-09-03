import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';

import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { Lang } from '@core/i18n/i18n.types';

import { BRAND } from '../../core/brand/brand';
import { MeStore } from '../../core/auth/me.store';
import { I18nService } from '../../core/i18n/i18n.service';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutStateService } from '../layout-state.service';
import { ThemeService } from '@williamsilva/nimbus-web-commons';
import { SessionService } from '../../core/auth/session.service';
import { SessionPingService } from '../../core/auth/session-ping.service';

@Component({
  standalone: true,
  selector: 'app-topbar',
  styleUrl: './topbar.component.css',
  templateUrl: './topbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, MenuModule, ButtonModule, TooltipModule, TranslateModule],
})
export class TopbarComponent {
  private readonly router = inject(Router);
  private readonly meStore = inject(MeStore);
  private readonly theme = inject(ThemeService);
  private readonly session = inject(SessionService);
  private readonly ping = inject(SessionPingService);
  private readonly layout = inject(LayoutStateService);

  readonly brand = BRAND;
  readonly me = this.meStore.me;
  readonly mode = this.theme.mode;
  readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);
  readonly sidebarVisible = this.layout.sidebarVisible;
  readonly remainingSeconds = this.session.remainingSeconds;
  readonly sessionExpired = computed(() => this.session.isExpired());

  readonly lang = this.i18n.appliedLang;

  readonly langMenuItems = computed<MenuItem[]>(() => {
    const current = this.lang();
    return [
      {
        label: 'Português',
        disabled: current === 'pt-BR',
        command: () => this.onLangChange('pt-BR'),
      },
      {
        label: 'English',
        disabled: current === 'en',
        command: () => this.onLangChange('en'),
      },
      {
        label: 'Español',
        disabled: current === 'es',
        command: () => this.onLangChange('es'),
      },
    ];
  });

  readonly currentLangLabel = computed(() => {
    const lang = this.lang();

    switch (lang) {
      case 'pt-BR':
        return 'PT';
      case 'en':
        return 'EN';
      case 'es':
        return 'ES';
      default:
        return 'PT';
    }
  });

  constructor() {
    this.ping.start();
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  toggleSidebar(): void {
    this.layout.toggleSidebar();
  }

  onLangChange(v: Lang): void {
    void this.i18n.setLang(v);
  }

  readonly initials = computed(() => {
    const me = this.me();
    const base = (me?.name || me?.username || 'CS').trim();
    const parts = base.split(/[\s._-]+/).filter(Boolean);
    const a = parts[0]?.[0] ?? 'C';
    const b = parts.length > 1 ? parts[1][0] : base.length > 1 ? base[1] : 'S';
    return (a + b).toUpperCase();
  });

  readonly mmss = computed(() => {
    const s = this.remainingSeconds();
    if (s == null) return null;

    const hh = Math.floor(s / 3600)
      .toString()
      .padStart(2, '0');
    const mm = Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
  });

  readonly sessionState = computed(() => {
    const s = this.remainingSeconds();

    if (s == null) return 'normal';
    if (s <= 120) return 'danger';
    if (s <= 300) return 'warning';

    return 'normal';
  });

  readonly statusLabel = computed(() =>
    this.sessionExpired() ? this.i18n.tUi('topbar.sessionExpired') : this.i18n.tUi('topbar.online'),
  );

  readonly statusTooltip = computed(() =>
    this.sessionExpired()
      ? this.i18n.tUi('topbar.sessionExpiredTooltip')
      : this.i18n.tUi('topbar.sessionExpireTooltip'),
  );

  readonly accountMenuItems = computed<MenuItem[]>(() => {
    this.lang();
    return [
      {
        label: this.i18n.tUi('menu.me'),
        icon: 'pi pi-user',
        command: () => this.router.navigateByUrl('/security/account/profile'),
      },
      {
        label: this.i18n.tUi('menu.security.changePassword'),
        icon: 'pi pi-key',
        command: () => this.router.navigateByUrl('/security/account/password'),
      },
      {
        separator: true,
      },
      {
        label: this.i18n.tUi('common.logout'),
        icon: 'pi pi-sign-out',
        command: () => this.auth.logout(),
      },
    ];
  });
}
