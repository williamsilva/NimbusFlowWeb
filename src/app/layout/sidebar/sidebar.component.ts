import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';

import { BRAND } from '../../core/brand/brand';
import { MeStore } from '../../core/auth/me.store';
import { APP_MENU } from '../../core/menu/menu.data';
import { AppMenuItem } from '../../core/menu/menu.model';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { PermissionService } from '../../core/auth/permission.service';

@Component({
  standalone: true,
  selector: 'app-sidebar',
  styleUrl: './sidebar.component.css',
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    RouterLinkActive,
  ],
})
export class SidebarComponent {
  readonly brand = BRAND;
  readonly i18n = inject(I18nService);

  private readonly router = inject(Router);
  private readonly meStore = inject(MeStore);
  private readonly auth = inject(AuthService);
  private readonly perms = inject(PermissionService);
  private readonly confirm = inject(ConfirmationService);

  readonly me = this.meStore.me;

  /**
   * Estado manual de expandir/recolher grupos.
   * Se não houver valor aqui, o grupo abre apenas quando algum filho estiver ativo.
   */
  private readonly groupState: Record<string, boolean> = {};

  readonly menu = computed(() => this.filterMenuByPermissions(APP_MENU));

  readonly initials = computed(() => {
    const me = this.me();
    const base = (me?.name || me?.username || 'CS').trim();
    const parts = base.split(/[\s._-]+/).filter(Boolean);
    const a = parts[0]?.[0] ?? 'C';
    const b = parts.length > 1 ? parts[1][0] : base.length > 1 ? base[1] : 'S';
    return (a + b).toUpperCase();
  });

  private filterMenuByPermissions(items: AppMenuItem[]): AppMenuItem[] {
    const out: AppMenuItem[] = [];

    for (const item of items) {
      const required = this.resolvePermissions(item);
      const allowedSelf = this.perms.canAccess(required, item.requireAll ?? false);

      const filteredChildren = item.children?.length
        ? this.filterMenuByPermissions(item.children)
        : undefined;

      const isLeaf = !!item.route;
      const childrenVisible = (filteredChildren?.length ?? 0) > 0;

      const visible = isLeaf ? allowedSelf : allowedSelf && childrenVisible;
      if (!visible) continue;

      out.push(filteredChildren ? { ...item, children: filteredChildren } : item);
    }

    return out;
  }

  private resolvePermissions(item: AppMenuItem): string[] {
    if (item.permissions?.length) {
      return item.permissions;
    }

    if (Array.isArray(item.permissions)) {
      return item.permissions;
    }

    if (item.permissions) {
      return [item.permissions];
    }

    return [];
  }

  toggleGroup(item: AppMenuItem): void {
    const key = this.itemKey(item);
    this.groupState[key] = !this.isExpanded(item);
  }

  isExpanded(item: AppMenuItem): boolean {
    const key = this.itemKey(item);

    if (key in this.groupState) {
      return this.groupState[key];
    }

    return this.hasActiveChild(item);
  }

  hasActiveChild(item: AppMenuItem): boolean {
    return item.children?.some((child) => this.isActiveOrChildActive(child)) ?? false;
  }

  isActiveOrChildActive(item: AppMenuItem): boolean {
    if (this.isActive(item)) return true;
    return item.children?.some((child) => this.isActiveOrChildActive(child)) ?? false;
  }

  isActive(item: AppMenuItem): boolean {
    if (!item.route) return false;

    return this.router.isActive(item.route, {
      paths: item.exact ? 'exact' : 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  activeIcon(item: AppMenuItem): string {
    return item.activeIcon ?? 'pi pi-map-marker nav-icon-active-bounce text-blue-500';
  }

  private itemKey(item: AppMenuItem): string {
    return item.route ?? item.labelKey;
  }

  logout(): void {
    this.confirm.confirm({
      header: this.i18n.tUi('confirm.logoutTitle'),
      message: this.i18n.tUi('confirm.logoutMessage'),
      acceptLabel: this.i18n.tUi('common.logout'),
      rejectLabel: this.i18n.tUi('common.cancel'),
      acceptButtonStyleClass: 'p-button-danger cs-confirm-accept',
      rejectButtonStyleClass: 'p-button-text cs-confirm-reject',
      accept: async () => {
        await this.auth.logout();
      },
    });
  }

  trackByLabelKey(_: number, item: AppMenuItem): string {
    return item.labelKey;
  }
}
