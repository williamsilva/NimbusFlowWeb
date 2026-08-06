import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

import { CurrentUser } from '../../core/auth/auth.service';

interface NavItem {
  labelKey: string;
  icon: string;
  link?: string;
  exact?: boolean;
  /** Nome cru da permissão (ex.: "USERS_CONSULT", mesmo formato de CurrentUser.permissions - sem
   *  prefixo "PERM_", esse só existe nas authorities do Spring Security no backend). Item sem
   *  esse campo é sempre visível (comportamento atual, preservado). */
  permission?: string;
  /** Item com children é só um rótulo de grupo (não navegável) - some inteiro se nenhum filho for
   *  visível (mesma regra do menu do CardSync: filterMenuByPermissions). */
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  @Input() currentUser: CurrentUser | null = null;
  @Output() logout = new EventEmitter<void>();

  readonly navItems: NavItem[] = [
    { labelKey: 'menu.dashboard', icon: 'dashboard', link: '/', exact: true },
    { labelKey: 'menu.suppliers', icon: 'storefront', link: '/suppliers', exact: false },
    { labelKey: 'menu.works', icon: 'construction', link: '/works', exact: false },
    { labelKey: 'menu.suggestions', icon: 'lightbulb', link: '/suggestions', exact: false },
    {
      labelKey: 'menu.security.title',
      icon: 'shield',
      children: [
        { labelKey: 'menu.security.users', icon: 'group', link: '/security/users', exact: false, permission: 'USERS_CONSULT' },
        { labelKey: 'menu.security.groups', icon: 'badge', link: '/security/groups', exact: false, permission: 'GROUPS_CONSULT' },
      ],
    },
  ];

  /** Filtra por permissão - só cosmético (ver comentário em supplier-list.component.ts), a
   *  validação real é 100% backend: sem a permissão, a própria chamada à API volta 403. */
  get visibleNavItems(): NavItem[] {
    return this.navItems
      .map((item) => this.filterItem(item))
      .filter((item): item is NavItem => item !== null);
  }

  private filterItem(item: NavItem): NavItem | null {
    if (item.children) {
      const visibleChildren = item.children.filter((child) => this.hasPermission(child.permission));
      return visibleChildren.length ? { ...item, children: visibleChildren } : null;
    }
    return this.hasPermission(item.permission) ? item : null;
  }

  private hasPermission(permission?: string): boolean {
    return !permission || !!this.currentUser?.permissions?.includes(permission);
  }

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
