import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { TaxIdPipe } from '../shared/pipes/tax-id.pipe';
import { StatusBadgeComponent, StatusTone } from '../shared/status-badge/status-badge.component';
import { AdminUser, UserAdminService } from './user.service';
import { UserFormComponent, UserFormDialogData } from './user-form.component';

const STATUS_TONE: Record<number, StatusTone> = {
  1: 'success',
  2: 'neutral',
  3: 'danger',
  4: 'neutral',
  5: 'warn',
};

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatTooltipModule,
    TaxIdPipe,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
  users: AdminUser[] = [];
  search = '';
  displayedColumns = ['name', 'userName', 'document', 'groups', 'status', 'actions'];

  canCreate = false;
  canChange = false;
  canActiveOrInactive = false;
  canResendInvite = false;

  constructor(
    private readonly userAdminService: UserAdminService,
    private readonly dialog: MatDialog,
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar,
    private readonly i18n: I18nService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.authService.loadMe().subscribe((user) => {
      this.canCreate = user.permissions.includes('USERS_CREATE');
      this.canChange = user.permissions.includes('USERS_CHANGE');
      this.canActiveOrInactive = user.permissions.includes('USERS_ACTIVE_OR_INACTIVE');
      this.canResendInvite = user.permissions.includes('USERS_RESEND_INVITE');
    });
  }

  get filteredUsers(): AdminUser[] {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      return this.users;
    }
    return this.users.filter((user) =>
      [user.name, user.userName, user.document].filter(Boolean).some((value) => value.toLowerCase().includes(term)),
    );
  }

  load(): void {
    this.userAdminService.list().subscribe((users) => (this.users = users));
  }

  statusTone(status: number): StatusTone {
    return STATUS_TONE[status] ?? 'neutral';
  }

  statusLabel(status: number): string {
    return this.i18n.tUi(`account.profile.status${status}`);
  }

  isPendingPassword(user: AdminUser): boolean {
    return user.status === 5;
  }

  // Angular não suporta arrow function (.map((g) => g.name)) direto na expressão do template -
  // por isso esse helper fica no componente (aqui, TS puro, arrow function normal funciona).
  groupNames(user: AdminUser): string {
    return user.groups.length ? user.groups.map((group) => group.name).join(', ') : '—';
  }

  openCreate(): void {
    this.openDialog(null);
  }

  openEdit(user: AdminUser): void {
    this.openDialog(user);
  }

  private openDialog(user: AdminUser | null): void {
    const ref = this.dialog.open<UserFormComponent, UserFormDialogData, boolean>(UserFormComponent, {
      data: { user },
      autoFocus: false,
      width: '560px',
    });

    ref.afterClosed().subscribe((saved) => {
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
      next: () => this.snackBar.open(this.i18n.tUi('users.list.resendInviteSuccess'), this.i18n.tUi('common.ok'), { duration: 4000 }),
      error: () => this.notifyError('users.list.resendInviteError'),
    });
  }

  private notifyError(key: string): void {
    this.snackBar.open(this.i18n.tUi(key), this.i18n.tUi('common.ok'), { duration: 5000 });
  }
}
