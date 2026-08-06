import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { ActiveFilterEntry, FilterPanelComponent } from '../shared/filter-panel/filter-panel.component';
import { NfPaginatorIntl } from '../shared/paginator/nf-paginator-intl';
import { GroupAdminService, GroupRef, GroupSummary } from './group.service';
import { GroupFormComponent, GroupFormDialogData } from './group-form.component';

interface GroupsFilterState {
  name: string;
  description: string;
  createdAt: string;
  createdBy: string;
}

function emptyFilter(): GroupsFilterState {
  return { name: '', description: '', createdAt: '', createdBy: '' };
}

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    FilterPanelComponent,
    TranslatePipe,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: NfPaginatorIntl }],
  templateUrl: './group-list.component.html',
  styleUrl: './group-list.component.scss',
})
export class GroupListComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<GroupSummary>([]);
  filter = emptyFilter();
  createdByOptions: string[] = [];
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
  ) {
    this.dataSource.filterPredicate = (row, filterJson) =>
      this.matchesFilter(row, JSON.parse(filterJson) as GroupsFilterState);
  }

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

  /** "label: valor" de cada filtro preenchido - alimenta o popup do ícone (i) do painel. */
  get activeFilters(): ActiveFilterEntry[] {
    const f = this.filter;
    const entries: ActiveFilterEntry[] = [];
    if (f.name) entries.push({ label: this.i18n.tUi('groups.list.filters.name'), value: f.name });
    if (f.description) entries.push({ label: this.i18n.tUi('groups.list.filters.description'), value: f.description });
    if (f.createdAt) entries.push({ label: this.i18n.tUi('groups.list.filters.createdAt'), value: f.createdAt });
    if (f.createdBy) entries.push({ label: this.i18n.tUi('groups.list.filters.createdBy'), value: f.createdBy });
    return entries;
  }

  applyFilters(): void {
    this.dataSource.filter = JSON.stringify(this.filter);
  }

  clearFilters(): void {
    this.filter = emptyFilter();
    this.dataSource.filter = '';
  }

  private matchesFilter(row: GroupSummary, f: GroupsFilterState): boolean {
    if (f.name && !row.name.toLowerCase().includes(f.name.toLowerCase())) return false;
    if (f.description && !row.description.toLowerCase().includes(f.description.toLowerCase())) return false;
    if (f.createdAt && row.createdAt.slice(0, 10) !== f.createdAt) return false;
    if (f.createdBy && row.createdBy !== f.createdBy) return false;
    return true;
  }

  load(): void {
    this.groupAdminService.list().subscribe((groups) => {
      this.dataSource.data = groups;
      this.createdByOptions = Array.from(new Set(groups.map((g) => g.createdBy).filter((v): v is string => !!v))).sort();
    });
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
