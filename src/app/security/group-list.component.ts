import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { ActiveFilterEntry, FilterPanelComponent } from '../shared/filter-panel/filter-panel.component';
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
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        ButtonModule,
        FloatLabelModule,
        InputTextModule,
        SelectModule,
        TableModule,
        TooltipModule,
        FilterPanelComponent,
        TranslatePipe,
    ],
    templateUrl: './group-list.component.html',
    styleUrl: './group-list.component.scss'
})
export class GroupListComponent implements OnInit {
  groups: GroupSummary[] = [];
  filter = emptyFilter();
  private appliedFilter = emptyFilter();
  createdByOptions: string[] = [];

  canChange = false;
  canDelete = false;
  canCreate = false;

  constructor(
    private readonly groupAdminService: GroupAdminService,
    private readonly dialogService: DialogService,
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
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

  get filteredGroups(): GroupSummary[] {
    return this.groups.filter((row) => this.matchesFilter(row, this.appliedFilter));
  }

  /** "label: valor" de cada filtro preenchido - alimenta o popup do ícone (i) do painel. */
  get activeFilters(): ActiveFilterEntry[] {
    const f = this.appliedFilter;
    const entries: ActiveFilterEntry[] = [];
    if (f.name) entries.push({ label: this.i18n.tUi('groups.list.filters.name'), value: f.name });
    if (f.description) entries.push({ label: this.i18n.tUi('groups.list.filters.description'), value: f.description });
    if (f.createdAt) entries.push({ label: this.i18n.tUi('groups.list.filters.createdAt'), value: f.createdAt });
    if (f.createdBy) entries.push({ label: this.i18n.tUi('groups.list.filters.createdBy'), value: f.createdBy });
    return entries;
  }

  applyFilters(): void {
    this.appliedFilter = { ...this.filter };
  }

  clearFilters(): void {
    this.filter = emptyFilter();
    this.appliedFilter = emptyFilter();
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
      this.groups = groups;
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
    const ref = this.dialogService.open<GroupFormComponent, GroupFormDialogData>(GroupFormComponent, {
      data: { group, readOnly },
      header: this.i18n.tUi(readOnly ? 'groups.form.viewTitle' : group ? 'groups.form.editTitle' : 'groups.form.createTitle'),
      width: '640px',
      modal: true,
    });

    ref?.onClose.subscribe((saved) => {
      if (saved) {
        this.load();
      }
    });
  }

  delete(group: GroupSummary): void {
    this.confirmationService.confirm({
      header: this.i18n.tUi('groups.list.deleteConfirmTitle'),
      message: this.i18n.tUi('groups.list.deleteConfirmMessage', { name: group.name }),
      acceptLabel: this.i18n.tUi('common.delete'),
      rejectLabel: this.i18n.tUi('common.cancel'),
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.groupAdminService.delete(group.id).subscribe({
          next: () => this.load(),
          error: (err) => {
            const code = (err?.error?.detail as string | undefined) ?? undefined;
            const message = code
              ? this.i18n.tUi(`errors.${code}`, undefined, this.i18n.tUi('groups.list.deleteError'))
              : this.i18n.tUi('groups.list.deleteError');
            this.messageService.add({ severity: 'error', summary: this.i18n.tUi('common.error'), detail: message });
          },
        });
      },
    });
  }
}
