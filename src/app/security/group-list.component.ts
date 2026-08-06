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
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { GroupAdminService, GroupOption } from './group.service';
import { GroupFormComponent, GroupFormDialogData } from './group-form.component';

@Component({
  selector: 'app-group-list',
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
    TranslatePipe,
  ],
  templateUrl: './group-list.component.html',
  styleUrl: './group-list.component.scss',
})
export class GroupListComponent implements OnInit {
  groups: GroupOption[] = [];
  search = '';
  displayedColumns = ['name', 'description', 'actions'];

  canChange = false;
  canDelete = false;
  canCreate = false;

  constructor(
    private readonly groupAdminService: GroupAdminService,
    private readonly dialog: MatDialog,
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar,
    private readonly i18n: I18nService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.authService.loadMe().subscribe((user) => {
      this.canCreate = user.permissions.includes('GROUPS_CREATE');
      this.canChange = user.permissions.includes('GROUPS_CHANGE');
      this.canDelete = user.permissions.includes('GROUPS_DELETE');
    });
  }

  get filteredGroups(): GroupOption[] {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      return this.groups;
    }
    return this.groups.filter((group) =>
      [group.name, group.description].filter(Boolean).some((value) => value.toLowerCase().includes(term)),
    );
  }

  load(): void {
    this.groupAdminService.list().subscribe((groups) => (this.groups = groups));
  }

  openCreate(): void {
    this.openDialog(null);
  }

  openEdit(group: GroupOption): void {
    this.openDialog(group);
  }

  private openDialog(group: GroupOption | null): void {
    const ref = this.dialog.open<GroupFormComponent, GroupFormDialogData, boolean>(GroupFormComponent, {
      data: { group },
      autoFocus: false,
      width: '640px',
    });

    ref.afterClosed().subscribe((saved) => {
      if (saved) {
        this.load();
      }
    });
  }

  delete(group: GroupOption): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      autoFocus: false,
      data: {
        title: this.i18n.tUi('groups.list.deleteConfirmTitle'),
        message: this.i18n.tUi('groups.list.deleteConfirmMessage', { name: group.name }),
        confirmLabel: this.i18n.tUi('common.delete'),
        icon: 'delete',
        danger: true,
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.groupAdminService.delete(group.id).subscribe({
        next: () => this.load(),
        error: (err) => {
          const code = (err?.error?.detail as string | undefined) ?? undefined;
          const message = code
            ? this.i18n.tUi(`errors.${code}`, undefined, this.i18n.tUi('groups.list.deleteError'))
            : this.i18n.tUi('groups.list.deleteError');
          this.snackBar.open(message, this.i18n.tUi('common.ok'), { duration: 5000 });
        },
      });
    });
  }
}
