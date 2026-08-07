import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { I18nService } from '../core/i18n/i18n.service';
import { PermissionService } from '../core/auth/permission.service';
import { ActiveFilterEntry, NbFiltersPanelComponent } from '../shared/filters-panel/nb-filters-panel.component';
import { NbPageHeaderComponent } from '../shared/page-header/nb-page-header.component';
import { NbStatefulListPage } from '../shared/list-base/nb-stateful-list-page';
import { onlyDigits } from '../shared/utils/br-format';
import { DateRange, isWithinDateRange } from '../shared/utils/date-range';
import { TaxIdPipe } from '../shared/pipes/tax-id.pipe';
import { SecurityPermissionPolicy } from './policy/security-permission.policy';
import { AdminUser, UserAdminService } from './user.service';
import { UserFormComponent } from './user-form.component';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

/** Status5 (senha pendente) em "info" (azul) - bate com o tom usado no CardSyncWeb. */
const STATUS_SEVERITY: Record<number, TagSeverity> = {
  1: 'success',
  2: 'secondary',
  3: 'danger',
  4: 'secondary',
  5: 'info',
};

const STATUS_OPTIONS = [1, 2, 3, 4, 5];

interface UsersFilterState {
  name: string;
  userName: string;
  document: string;
  status: number[];
  lastLoginAtRange: DateRange;
  blockedUntilRange: DateRange;
  passwordExpiresAtRange: DateRange;
  createdAtRange: DateRange;
  createdBy: string[];
}

@Component({
  standalone: true,
  selector: 'app-user-list',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    DatePickerModule,
    FloatLabelModule,
    InputTextModule,
    MultiSelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    NbFiltersPanelComponent,
    NbPageHeaderComponent,
    TaxIdPipe,
    TranslatePipe,
    UserFormComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent extends NbStatefulListPage<UsersFilterState> implements OnInit {
  private readonly userAdminService = inject(UserAdminService);
  private readonly messageService = inject(MessageService);

  readonly i18n = inject(I18nService);
  readonly perms = inject(PermissionService);
  readonly secPolicy = inject(SecurityPermissionPolicy);

  readonly users = signal<AdminUser[]>([]);
  readonly selected = signal<AdminUser[]>([]);
  readonly statusOptions = STATUS_OPTIONS;
  readonly createdByOptions = signal<string[]>([]);

  readonly upsertVisible = signal(false);
  readonly editingUser = signal<AdminUser | null>(null);

  ngOnInit(): void {
    this.initStatefulList();
  }

  load(): void {
    this.userAdminService.list().subscribe((users) => {
      this.users.set(users);
      this.createdByOptions.set(
        Array.from(new Set(users.map((u) => u.createdBy).filter((v): v is string => !!v))).sort(),
      );
      this.selected.set([]);
    });
  }

  protected override refresh(): void {
    this.load();
  }

  protected override tableRowsKey(): string {
    return 'nimbusflow.users.table.rows.v1';
  }

  protected override filtersKey(): string {
    return 'nimbusflow.users.filters.v1';
  }

  // ------------------------- Filtros avançados -------------------------

  get statusSelectOptions(): { label: string; value: number }[] {
    return this.statusOptions.map((s) => ({ label: this.statusLabel(s), value: s }));
  }

  /** Filtragem client-side, aplicada só ao clicar "Buscar" (appliedFilter), não a cada tecla
   *  digitada em filter - comportamento "deferred" do NbStatefulListPage. */
  readonly filteredUsers = computed(() => {
    const applied = this.appliedFilter();
    return this.users().filter((row) => this.matchesFilter(row, applied));
  });

  protected override emptyFilter(): UsersFilterState {
    return {
      name: '',
      userName: '',
      document: '',
      status: [],
      lastLoginAtRange: null,
      blockedUntilRange: null,
      passwordExpiresAtRange: null,
      createdAtRange: null,
      createdBy: [],
    };
  }

  /** "label: valor" de cada filtro preenchido - alimenta o popup do ícone (i) do nb-filters-panel. */
  protected override buildActiveFilters(f: UsersFilterState): ActiveFilterEntry[] {
    const entries: ActiveFilterEntry[] = [];
    if (f.name) entries.push({ label: this.i18n.tUi('users.list.filters.name'), value: f.name });
    if (f.userName) entries.push({ label: this.i18n.tUi('users.list.filters.userName'), value: f.userName });
    if (f.document) entries.push({ label: this.i18n.tUi('users.list.filters.document'), value: f.document });
    if (f.status.length) {
      entries.push({ label: this.i18n.tUi('users.list.filters.status'), value: f.status.map((s) => this.statusLabel(s)).join(', ') });
    }
    this.pushRangeFilter(entries, f.lastLoginAtRange, 'users.list.filters.lastLoginAt');
    this.pushRangeFilter(entries, f.blockedUntilRange, 'users.list.filters.blockedUntil');
    this.pushRangeFilter(entries, f.passwordExpiresAtRange, 'users.list.filters.passwordExpiresAt');
    this.pushRangeFilter(entries, f.createdAtRange, 'users.list.filters.createdAt');
    if (f.createdBy.length) entries.push({ label: this.i18n.tUi('users.list.filters.createdBy'), value: f.createdBy.join(', ') });
    return entries;
  }

  private pushRangeFilter(entries: ActiveFilterEntry[], range: DateRange, labelKey: string): void {
    if (!range) return;
    entries.push({ label: this.i18n.tUi(labelKey), value: `${this.formatDate(range[0])} – ${this.formatDate(range[1])}` });
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.i18n.getLocale(), { dateStyle: 'short' }).format(new Date(value));
  }

  private matchesFilter(row: AdminUser, f: UsersFilterState): boolean {
    if (f.name && !row.name.toLowerCase().includes(f.name.toLowerCase())) return false;
    if (f.userName && !row.userName.toLowerCase().includes(f.userName.toLowerCase())) return false;
    if (f.document && !row.document.includes(onlyDigits(f.document))) return false;
    if (f.status.length && !f.status.includes(row.status)) return false;
    if (!isWithinDateRange(row.lastLoginAt, f.lastLoginAtRange)) return false;
    if (!isWithinDateRange(row.blockedUntil, f.blockedUntilRange)) return false;
    if (!isWithinDateRange(row.passwordExpiresAt, f.passwordExpiresAtRange)) return false;
    if (!isWithinDateRange(row.createdAt, f.createdAtRange)) return false;
    if (f.createdBy.length && !f.createdBy.includes(row.createdBy ?? '')) return false;
    return true;
  }

  // ------------------------- Seleção em massa -------------------------

  readonly selectionMode = computed(() => {
    const selected = this.selected();
    if (!selected.length) return null;
    if (selected.every((u) => this.secPolicy.modeForRow(u) === 'activate')) return 'activate';
    if (selected.every((u) => this.secPolicy.modeForRow(u) === 'deactivate')) return 'deactivate';
    return null;
  });

  activateSelected(): void {
    const ids = this.selected().map((u) => u.id);
    this.userAdminService.activateBulk(ids).subscribe({
      next: () => {
        this.selected.set([]);
        this.load();
      },
      error: () => this.notifyError('users.list.activateError'),
    });
  }

  deactivateSelected(): void {
    const ids = this.selected().map((u) => u.id);
    this.userAdminService.deactivateBulk(ids).subscribe({
      next: () => {
        this.selected.set([]);
        this.load();
      },
      error: () => this.notifyError('users.list.deactivateError'),
    });
  }

  // ------------------------- Status -------------------------

  statusSeverity(status: number): TagSeverity {
    return STATUS_SEVERITY[status] ?? 'secondary';
  }

  statusLabel(status: number): string {
    return this.i18n.tUi(`account.profile.status${status}`);
  }

  isPendingPassword(user: AdminUser): boolean {
    return user.status === 5;
  }

  // ------------------------- CRUD -------------------------

  goNew(): void {
    if (!this.secPolicy.canCreate()) return;
    this.editingUser.set(null);
    this.upsertVisible.set(true);
  }

  edit(user: AdminUser): void {
    if (!this.secPolicy.canEdit(user)) return;
    this.editingUser.set(user);
    this.upsertVisible.set(true);
  }

  onUpsertVisibleChange(visible: boolean): void {
    this.upsertVisible.set(visible);
    if (!visible) {
      this.editingUser.set(null);
    }
  }

  onSaved(): void {
    this.load();
  }

  activate(user: AdminUser): void {
    this.userAdminService.activate(user.id).subscribe({
      next: () => this.load(),
      error: () => this.notifyError('users.list.activateError'),
    });
  }

  deactivate(user: AdminUser): void {
    this.userAdminService.deactivate(user.id).subscribe({
      next: () => this.load(),
      error: () => this.notifyError('users.list.deactivateError'),
    });
  }

  resendInvite(user: AdminUser): void {
    this.userAdminService.resendInvite(user.id).subscribe({
      next: () =>
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi('users.list.resendInviteSuccess'),
        }),
      error: () => this.notifyError('users.list.resendInviteError'),
    });
  }

  private notifyError(key: string): void {
    this.messageService.add({ severity: 'error', summary: this.i18n.tUi('common.error'), detail: this.i18n.tUi(key) });
  }
}
