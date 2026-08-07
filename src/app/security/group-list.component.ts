import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { I18nService } from '../core/i18n/i18n.service';
import { PermissionService } from '../core/auth/permission.service';
import { ActiveFilterEntry, NbFiltersPanelComponent } from '../shared/filters-panel/nb-filters-panel.component';
import { NbPageHeaderComponent } from '../shared/page-header/nb-page-header.component';
import { NbStatefulListPage } from '../shared/list-base/nb-stateful-list-page';
import { DateRange, isWithinDateRange } from '../shared/utils/date-range';
import { GroupAdminService, GroupRef, GroupSummary } from './group.service';
import { GroupsPermissionPolicy } from './policy/groups-permission.policy';
import { GroupFormComponent } from './group-form.component';

interface GroupsFilterState {
  name: string;
  description: string;
  createdAtRange: DateRange;
  createdBy: string[];
}

@Component({
  standalone: true,
  selector: 'app-group-list',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    DatePickerModule,
    FloatLabelModule,
    InputTextModule,
    MultiSelectModule,
    TableModule,
    TooltipModule,
    NbFiltersPanelComponent,
    NbPageHeaderComponent,
    TranslatePipe,
    GroupFormComponent,
  ],
  templateUrl: './group-list.component.html',
  styleUrl: './group-list.component.scss',
})
export class GroupListComponent extends NbStatefulListPage<GroupsFilterState> implements OnInit {
  private readonly groupAdminService = inject(GroupAdminService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly i18n = inject(I18nService);
  readonly perms = inject(PermissionService);
  readonly secPolicy = inject(GroupsPermissionPolicy);

  readonly groups = signal<GroupSummary[]>([]);
  readonly createdByOptions = signal<string[]>([]);

  readonly upsertVisible = signal(false);
  readonly editingGroup = signal<GroupRef | null>(null);

  ngOnInit(): void {
    this.initStatefulList();
  }

  protected override refresh(): void {
    this.load();
  }

  protected override tableRowsKey(): string {
    return 'nimbusflow.groups.table.rows.v1';
  }

  protected override filtersKey(): string {
    return 'nimbusflow.groups.filters.v1';
  }

  protected override emptyFilter(): GroupsFilterState {
    return { name: '', description: '', createdAtRange: null, createdBy: [] };
  }

  readonly filteredGroups = computed(() => {
    const applied = this.appliedFilter();
    return this.groups().filter((row) => this.matchesFilter(row, applied));
  });

  /** "label: valor" de cada filtro preenchido - alimenta o popup do ícone (i) do nb-filters-panel. */
  protected override buildActiveFilters(f: GroupsFilterState): ActiveFilterEntry[] {
    const entries: ActiveFilterEntry[] = [];
    if (f.name) entries.push({ label: this.i18n.tUi('groups.list.filters.name'), value: f.name });
    if (f.description) entries.push({ label: this.i18n.tUi('groups.list.filters.description'), value: f.description });
    if (f.createdAtRange) {
      entries.push({
        label: this.i18n.tUi('groups.list.filters.createdAt'),
        value: `${this.formatDate(f.createdAtRange[0])} – ${this.formatDate(f.createdAtRange[1])}`,
      });
    }
    if (f.createdBy.length) entries.push({ label: this.i18n.tUi('groups.list.filters.createdBy'), value: f.createdBy.join(', ') });
    return entries;
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat(this.i18n.getLocale(), { dateStyle: 'short' }).format(new Date(value));
  }

  private matchesFilter(row: GroupSummary, f: GroupsFilterState): boolean {
    if (f.name && !row.name.toLowerCase().includes(f.name.toLowerCase())) return false;
    if (f.description && !row.description.toLowerCase().includes(f.description.toLowerCase())) return false;
    if (!isWithinDateRange(row.createdAt, f.createdAtRange)) return false;
    if (f.createdBy.length && !f.createdBy.includes(row.createdBy ?? '')) return false;
    return true;
  }

  load(): void {
    this.groupAdminService.list().subscribe((groups) => {
      this.groups.set(groups);
      this.createdByOptions.set(
        Array.from(new Set(groups.map((g) => g.createdBy).filter((v): v is string => !!v))).sort(),
      );
    });
  }

  goNew(): void {
    if (!this.secPolicy.canCreate()) return;
    this.editingGroup.set(null);
    this.upsertVisible.set(true);
  }

  edit(group: GroupRef): void {
    if (!this.secPolicy.canEdit(group)) return;
    this.editingGroup.set(group);
    this.upsertVisible.set(true);
  }

  onUpsertVisibleChange(visible: boolean): void {
    this.upsertVisible.set(visible);
    if (!visible) {
      this.editingGroup.set(null);
    }
  }

  onSaved(): void {
    this.load();
  }

  delete(group: GroupSummary): void {
    if (!this.secPolicy.canDelete(group)) return;

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
