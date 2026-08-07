import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { I18nService } from '../core/i18n/i18n.service';
import { PermissionService } from '../core/auth/permission.service';
import { GroupAdminService, GroupDetail, PermissionOption } from './group.service';
import { GroupsPermissionPolicy } from './policy/groups-permission.policy';

type DetailTab = 'summary' | 'permissions';

/**
 * Mesmo papel do GroupDetailComponent do CardSyncWeb (abas Resumo/Permissões), sem a aba
 * "Usuários" - o NimbusFlow não gerencia (nem expõe a lista de) membros do grupo por aqui, decisão
 * de propósito (ver AdminGroupResponse/AdminGroupService no NimbusFlowServer); só o contador
 * (usersCount) fica visível.
 */
@Component({
  standalone: true,
  selector: 'app-group-detail',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    MultiSelectModule,
    ProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './group-detail.component.html',
  styleUrl: './group-detail.component.scss',
})
export class GroupDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly groupAdminService = inject(GroupAdminService);
  private readonly messageService = inject(MessageService);

  readonly i18n = inject(I18nService);
  readonly perms = inject(PermissionService);
  readonly secPolicy = inject(GroupsPermissionPolicy);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly tab = signal<DetailTab>('summary');

  readonly group = signal<GroupDetail | null>(null);
  readonly permissionOptions = signal<PermissionOption[]>([]);
  readonly selectedPermissionIds = signal<string[]>([]);

  readonly canManagePermissions = computed(() => {
    const g = this.group();
    return !!g && this.secPolicy.canManagePermissions(g);
  });

  readonly initials = computed(() => {
    const name = (this.group()?.name ?? '').trim();
    if (!name) return 'G';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.load(id);
    });

    this.groupAdminService
      .listPermissionOptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((options) => this.permissionOptions.set(options));
  }

  load(id: string): void {
    this.loading.set(true);
    this.groupAdminService
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (detail) => {
          this.group.set(detail);
          this.selectedPermissionIds.set(detail.permissions.map((p) => p.id));
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  setTab(tab: DetailTab): void {
    this.tab.set(tab);
  }

  back(): void {
    this.router.navigateByUrl('/security/groups');
  }

  savePermissions(): void {
    const group = this.group();
    if (!group || !this.canManagePermissions()) return;

    this.saving.set(true);
    this.groupAdminService
      .updatePermissions(group.id, this.selectedPermissionIds())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.group.set(updated);
          this.selectedPermissionIds.set(updated.permissions.map((p) => p.id));
          this.saving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('groups.detail.permissions.saved'),
          });
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('groups.detail.permissions.saveError'),
          });
        },
      });
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}
