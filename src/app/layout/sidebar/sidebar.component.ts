import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
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
    imports: [RouterLink, RouterLinkActive, ButtonModule, TooltipModule, TranslatePipe],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() currentUser: CurrentUser | null = null;
  @Output() logout = new EventEmitter<void>();

  readonly navItems: NavItem[] = [
    { labelKey: 'menu.dashboard', icon: 'pi pi-home', link: '/', exact: true },
    { labelKey: 'menu.suppliers', icon: 'pi pi-shop', link: '/suppliers', exact: false },
    { labelKey: 'menu.works', icon: 'pi pi-hammer', link: '/works', exact: false },
    { labelKey: 'menu.suggestions', icon: 'pi pi-lightbulb', link: '/suggestions', exact: false },
    {
      labelKey: 'menu.security.title',
      icon: 'pi pi-shield',
      children: [
        { labelKey: 'menu.security.users', icon: 'pi pi-users', link: '/security/users', exact: false, permission: 'USERS_CONSULT' },
        { labelKey: 'menu.security.groups', icon: 'pi pi-id-card', link: '/security/groups', exact: false, permission: 'GROUPS_CONSULT' },
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
