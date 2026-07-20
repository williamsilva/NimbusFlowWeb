import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CurrentUser } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';

export type SessionTone = 'normal' | 'warning' | 'danger';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
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

  constructor(readonly theme: ThemeService) {}

  get initials(): string {
    const name = this.currentUser?.name || this.currentUser?.username || '?';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }
}
