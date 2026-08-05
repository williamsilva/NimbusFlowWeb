import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

import { CurrentUser } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { Lang } from '../../core/i18n/i18n.types';
import { ThemeService } from '../../core/theme/theme.service';

export type SessionTone = 'normal' | 'warning' | 'danger';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule, MatTooltipModule, TranslatePipe],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
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
