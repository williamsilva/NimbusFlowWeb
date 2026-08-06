import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { AuthService, CurrentUser } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { ListDialogComponent } from '../shared/list-dialog/list-dialog.component';
import { TaxIdPipe } from '../shared/pipes/tax-id.pipe';
import { AccountService, Profile } from './account.service';

@Component({
    selector: 'app-profile',
    imports: [
        CommonModule,
        RouterLink,
        MatButtonModule,
        MatCardModule,
        MatChipsModule,
        MatIconModule,
        MatProgressSpinnerModule,
        TranslatePipe,
        TaxIdPipe,
    ],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  loading = true;
  profile: Profile | null = null;
  me: CurrentUser | null = null;

  constructor(
    private readonly accountService: AccountService,
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    forkJoin({
      profile: this.accountService.getMyProfile(),
      me: this.authService.loadMe(),
    }).subscribe({
      next: ({ profile, me }) => {
        this.profile = profile;
        this.me = me;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open(this.i18n.tUi('account.profile.loadError'), this.i18n.tUi('common.ok'), { duration: 5000 });
      },
    });
  }

  get initials(): string {
    const name = this.profile?.name || this.me?.name || this.me?.username || '?';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  get isBlocked(): boolean {
    if (!this.profile?.blockedUntil) return false;
    return new Date(this.profile.blockedUntil).getTime() > Date.now();
  }

  statusKey(status: number | undefined): string {
    return `account.profile.status${status ?? 0}`;
  }

  countLabel(count: number): string {
    return this.i18n.tUi('account.profile.items', { count });
  }

  openGroupsDialog(): void {
    this.dialog.open(ListDialogComponent, {
      autoFocus: false,
      maxWidth: '700px',
      width: '92vw',
      data: {
        title: this.i18n.tUi('account.profile.groups'),
        subtitle: this.i18n.tUi('account.profile.groupsSubtitle'),
        items: this.me?.groups ?? [],
      },
    });
  }

  openPermissionsDialog(): void {
    this.dialog.open(ListDialogComponent, {
      autoFocus: false,
      maxWidth: '1100px',
      width: '92vw',
      data: {
        title: this.i18n.tUi('account.profile.permissions'),
        subtitle: this.i18n.tUi('account.profile.permissionsSubtitle'),
        items: this.me?.permissions ?? [],
      },
    });
  }
}
