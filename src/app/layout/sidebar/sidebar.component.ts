import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CurrentUser } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  exact: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Input() currentUser: CurrentUser | null = null;
  @Output() logout = new EventEmitter<void>();

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', link: '/', exact: true },
    { label: 'Fornecedores', icon: 'storefront', link: '/suppliers', exact: false },
    { label: 'Obras', icon: 'construction', link: '/works', exact: false },
    { label: 'Sugestões', icon: 'lightbulb', link: '/suggestions', exact: false },
  ];

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
