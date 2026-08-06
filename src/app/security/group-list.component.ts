import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { NfPaginatorIntl } from '../shared/paginator/nf-paginator-intl';
import { GroupAdminService, GroupRef, GroupSummary } from './group.service';
import { GroupFormComponent, GroupFormDialogData } from './group-form.component';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: NfPaginatorIntl }],
  templateUrl: './group-list.component.html',
  styleUrl: './group-list.component.scss',
})
export class GroupListComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<GroupSummary>([]);
  search = '';
  displayedColumns = ['name', 'description', 'createdAt', 'createdBy', 'usersCount', 'permissionsCount', 'actions'];

  canChange = false;
  canDelete = false;
  canCreate = false;

  @ViewChild(MatSort) private readonly sort!: MatSort;
  @ViewChild(MatPaginator) private readonly paginator!: MatPaginator;

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

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(): void {
    this.dataSource.filter = this.search.trim().toLowerCase();
  }

  load(): void {
    this.groupAdminService.list().subscribe((groups) => (this.dataSource.data = groups));
  }

  openCreate(): void {
    this.openDialog(null, false);
  }

  openEdit(group: GroupRef): void {
    this.openDialog(group, false);
  }

  /** Sempre disponível pra quem lista (GROUPS_CONSULT já é exigido pra chegar nesta tela) - cobre
   *  quem não tem GROUPS_CHANGE mas ainda precisa inspecionar nome/descrição/permissões. */
  openView(group: GroupRef): void {
    this.openDialog(group, true);
  }

  private openDialog(group: GroupRef | null, readOnly: boolean): void {
    const ref = this.dialog.open<GroupFormComponent, GroupFormDialogData, boolean>(GroupFormComponent, {
      data: { group, readOnly },
      autoFocus: false,
      width: '640px',
    });

    ref.afterClosed().subscribe((saved) => {
      if (saved) {
        this.load();
      }
    });
  }

  delete(group: GroupSummary): void {
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
