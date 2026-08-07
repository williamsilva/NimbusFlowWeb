import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { TranslatePipe } from '@ngx-translate/core';

import { CurrentUser } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Lang } from '../../core/i18n/i18n.types';
import { ThemeService } from '../../core/theme/theme.service';

export type SessionTone = 'normal' | 'warning' | 'danger';

@Component({
    selector: 'app-topbar',
    imports: [RouterLink, ButtonModule, MenuModule, TooltipModule, TranslatePipe],
    templateUrl: './topbar.component.html',
    styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  @Input() currentUser: CurrentUser | null = null;
  @Input() sidebarVisible = true;
  @Input() sessionLabel: string | null = null;
  @Input() sessionTone: SessionTone = 'normal';

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  // Rótulo de cada idioma sempre no próprio idioma (não traduzido) - mesma convenção do
  // CardSyncWeb pra um seletor de idioma (a lista de opções não muda de acordo com a seleção).
  readonly langOptions: { value: Lang; label: string }[] = [
    { value: 'pt-BR', label: 'Português' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
  ];

  constructor(
    readonly theme: ThemeService,
    readonly i18n: I18nService,
    private readonly router: Router,
  ) {}

  get initials(): string {
    const name = this.currentUser?.name || this.currentUser?.username || '?';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  get currentLangLabel(): string {
    switch (this.i18n.appliedLang()) {
      case 'en':
        return 'EN';
      case 'es':
        return 'ES';
      case 'pt-BR':
      default:
        return 'PT';
    }
  }

  get langMenuItems(): MenuItem[] {
    return this.langOptions.map((option) => ({
      label: option.label,
      disabled: option.value === this.i18n.appliedLang(),
      command: () => this.onLangChange(option.value),
    }));
  }

  get accountMenuItems(): MenuItem[] {
    return [
      { label: this.i18n.tUi('menu.me'), icon: 'pi pi-user', command: () => this.goToProfile() },
      { label: this.i18n.tUi('menu.changePassword'), icon: 'pi pi-key', command: () => this.goToChangePassword() },
      { separator: true },
      { label: this.i18n.tUi('menu.logout'), icon: 'pi pi-sign-out', command: () => this.logout.emit() },
    ];
  }

  onLangChange(lang: Lang): void {
    void this.i18n.setLang(lang);
  }

  goToProfile(): void {
    this.router.navigateByUrl('/account/profile');
  }

  goToChangePassword(): void {
    this.router.navigateByUrl('/account/password');
  }
}
