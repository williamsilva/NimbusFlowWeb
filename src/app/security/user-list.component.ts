import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogService } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { ActiveFilterEntry, FilterPanelComponent } from '../shared/filter-panel/filter-panel.component';
import { onlyDigits } from '../shared/utils/br-format';
import { TaxIdPipe } from '../shared/pipes/tax-id.pipe';
import { StatusBadgeComponent, StatusTone } from '../shared/status-badge/status-badge.component';
import { AdminUser, UserAdminService } from './user.service';
import { UserFormComponent, UserFormDialogData } from './user-form.component';

/** Status5 (senha pendente) em "info" (azul) - bate com o tom usado no CardSyncWeb. */
const STATUS_TONE: Record<number, StatusTone> = {
  1: 'success',
  2: 'neutral',
  3: 'danger',
  4: 'neutral',
  5: 'info',
};

const STATUS_OPTIONS = [1, 2, 3, 4, 5];

interface UsersFilterState {
  name: string;
  userName: string;
  document: string;
  status: number[];
  lastLoginAt: string;
  blockedUntil: string;
  passwordExpiresAt: string;
  createdAt: string;
  createdBy: string;
}

function emptyFilter(): UsersFilterState {
  return {
    name: '',
    userName: '',
    document: '',
    status: [],
    lastLoginAt: '',
    blockedUntil: '',
    passwordExpiresAt: '',
    createdAt: '',
    createdBy: '',
  };
}

@Component({
    selector: 'app-user-list',
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        ButtonModule,
        CheckboxModule,
        FloatLabelModule,
        InputTextModule,
        MultiSelectModule,
        SelectModule,
        TableModule,
        TooltipModule,
        FilterPanelComponent,
        TaxIdPipe,
        StatusBadgeComponent,
        TranslatePipe,
    ],
    templateUrl: './user-list.component.html',
    styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {
  users: AdminUser[] = [];
  selected: AdminUser[] = [];
  filter = emptyFilter();
  private appliedFilter = emptyFilter();
  readonly statusOptions = STATUS_OPTIONS;
  createdByOptions: string[] = [];

  canCreate = false;
  canChange = false;
  canActiveOrInactive = false;
  canResendInvite = false;
  private currentUserName = '';

  constructor(
    private readonly userAdminService: UserAdminService,
    private readonly dialogService: DialogService,
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly i18n: I18nService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.authService.loadMe().subscribe((user) => {
      this.currentUserName = user.username ?? '';
      this.canCreate = user.permissions.includes('USERS_CREATE');
      this.canChange = user.permissions.includes('USERS_CHANGE');
      this.canActiveOrInactive = user.permissions.includes('USERS_ACTIVE_OR_INACTIVE');
      this.canResendInvite = user.permissions.includes('USERS_RESEND_INVITE');
    });
  }

  load(): void {
    this.userAdminService.list().subscribe((users) => {
      this.users = users;
      this.createdByOptions = Array.from(
        new Set(users.map((u) => u.createdBy).filter((v): v is string => !!v)),
      ).sort();
      this.selected = [];
    });
  }

  // ------------------------- Filtros avançados -------------------------

  get statusSelectOptions(): { label: string; value: number }[] {
    return this.statusOptions.map((s) => ({ label: this.statusLabel(s), value: s }));
  }

  /** Filtragem client-side, aplicada só ao clicar "Buscar" (this.appliedFilter), não a cada
   *  tecla digitada em this.filter - mesmo comportamento "deferred" de antes (MatTableDataSource
   *  com filter setado só em applyFilters()), agora sobre um array puro pro p-table. */
  get filteredUsers(): AdminUser[] {
    return this.users.filter((row) => this.matchesFilter(row, this.appliedFilter));
  }

  /** "label: valor" de cada filtro preenchido - alimenta o popup do ícone (i) do painel. */
  get activeFilters(): ActiveFilterEntry[] {
    const f = this.appliedFilter;
    const entries: ActiveFilterEntry[] = [];
    if (f.name) entries.push({ label: this.i18n.tUi('users.list.filters.name'), value: f.name });
    if (f.userName) entries.push({ label: this.i18n.tUi('users.list.filters.userName'), value: f.userName });
    if (f.document) entries.push({ label: this.i18n.tUi('users.list.filters.document'), value: f.document });
    if (f.status.length) {
      entries.push({ label: this.i18n.tUi('users.list.filters.status'), value: f.status.map((s) => this.statusLabel(s)).join(', ') });
    }
    if (f.lastLoginAt) entries.push({ label: this.i18n.tUi('users.list.filters.lastLoginAt'), value: f.lastLoginAt });
    if (f.blockedUntil) entries.push({ label: this.i18n.tUi('users.list.filters.blockedUntil'), value: f.blockedUntil });
    if (f.passwordExpiresAt) entries.push({ label: this.i18n.tUi('users.list.filters.passwordExpiresAt'), value: f.passwordExpiresAt });
    if (f.createdAt) entries.push({ label: this.i18n.tUi('users.list.filters.createdAt'), value: f.createdAt });
    if (f.createdBy) entries.push({ label: this.i18n.tUi('users.list.filters.createdBy'), value: f.createdBy });
    return entries;
  }

  applyFilters(): void {
    this.appliedFilter = { ...this.filter, status: [...this.filter.status] };
  }

  clearFilters(): void {
    this.filter = emptyFilter();
    this.appliedFilter = emptyFilter();
  }

  private matchesFilter(row: AdminUser, f: UsersFilterState): boolean {
    if (f.name && !row.name.toLowerCase().includes(f.name.toLowerCase())) return false;
    if (f.userName && !row.userName.toLowerCase().includes(f.userName.toLowerCase())) return false;
    if (f.document && !row.document.includes(onlyDigits(f.document))) return false;
    if (f.status.length && !f.status.includes(row.status)) return false;
    if (f.lastLoginAt && !this.sameDay(row.lastLoginAt, f.lastLoginAt)) return false;
    if (f.blockedUntil && !this.sameDay(row.blockedUntil, f.blockedUntil)) return false;
    if (f.passwordExpiresAt && !this.sameDay(row.passwordExpiresAt, f.passwordExpiresAt)) return false;
    if (f.createdAt && !this.sameDay(row.createdAt, f.createdAt)) return false;
    if (f.createdBy && row.createdBy !== f.createdBy) return false;
    return true;
  }

  private sameDay(value: string | null, filterDate: string): boolean {
    return !!value && value.slice(0, 10) === filterDate;
  }

  // ------------------------- Seleção em massa -------------------------

  /** Mesma regra do CardSyncWeb: a seleção só habilita um "modo" por vez (ativar OU desativar),
   *  nunca os dois - evita misturar transições inválidas numa única chamada em lote. Desativar a
   *  própria conta nunca é permitido (bloqueado no NimbusAuth), então nem oferece o botão. */
  get selectionMode(): 'activate' | 'deactivate' | null {
    const selected = this.selected;
    if (!selected.length) return null;
    if (selected.every((u) => u.status === 2)) return 'activate';
    if (selected.every((u) => u.status === 1 && u.userName !== this.currentUserName)) return 'deactivate';
    return null;
  }

  activateSelected(): void {
    const ids = this.selected.map((u) => u.id);
    this.userAdminService.activateBulk(ids).subscribe({
      next: () => {
        this.selected = [];
        this.load();
      },
      error: () => this.notifyError('users.list.activateError'),
    });
  }

  deactivateSelected(): void {
    const ids = this.selected.map((u) => u.id);
    this.userAdminService.deactivateBulk(ids).subscribe({
      next: () => {
        this.selected = [];
        this.load();
      },
      error: () => this.notifyError('users.list.deactivateError'),
    });
  }

  // ------------------------- Status -------------------------

  statusTone(status: number): StatusTone {
    return STATUS_TONE[status] ?? 'neutral';
  }

  statusLabel(status: number): string {
    return this.i18n.tUi(`account.profile.status${status}`);
  }

  isPendingPassword(user: AdminUser): boolean {
    return user.status === 5;
  }

  // ------------------------- CRUD -------------------------

  openCreate(): void {
    this.openDialog(null);
  }

  openEdit(user: AdminUser): void {
    this.openDialog(user);
  }

  private openDialog(user: AdminUser | null): void {
    const ref = this.dialogService.open<UserFormComponent, UserFormDialogData>(UserFormComponent, {
      data: { user },
      header: this.i18n.tUi(user ? 'users.form.editTitle' : 'users.form.createTitle'),
      width: '560px',
      modal: true,
    });

    ref?.onClose.subscribe((saved) => {
      if (saved) {
        this.load();
      }
    });
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
