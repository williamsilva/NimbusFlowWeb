import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { I18nService } from '../core/i18n/i18n.service';
import { PermissionService } from '../core/auth/permission.service';
import { ActiveFilterEntry, FilterPanelComponent } from '../shared/filter-panel/filter-panel.component';
import { GroupAdminService, GroupRef, GroupSummary } from './group.service';
import { GroupsPermissionPolicy } from './policy/groups-permission.policy';
import { GroupFormComponent } from './group-form.component';

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
  standalone: true,
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
    GroupFormComponent,
  ],
  templateUrl: './group-list.component.html',
  styleUrl: './group-list.component.scss',
})
export class GroupListComponent implements OnInit {
  private readonly groupAdminService = inject(GroupAdminService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly i18n = inject(I18nService);
  readonly perms = inject(PermissionService);
  readonly secPolicy = inject(GroupsPermissionPolicy);

  readonly groups = signal<GroupSummary[]>([]);
  readonly filter = signal<GroupsFilterState>(emptyFilter());
  private readonly appliedFilter = signal<GroupsFilterState>(emptyFilter());
  readonly createdByOptions = signal<string[]>([]);

  readonly upsertVisible = signal(false);
  readonly editingGroup = signal<GroupRef | null>(null);

  ngOnInit(): void {
    this.load();
  }

  readonly filteredGroups = computed(() => {
    const applied = this.appliedFilter();
    return this.groups().filter((row) => this.matchesFilter(row, applied));
  });

  /** "label: valor" de cada filtro preenchido - alimenta o popup do ícone (i) do painel. */
  readonly activeFilters = computed<ActiveFilterEntry[]>(() => {
    const f = this.appliedFilter();
    const entries: ActiveFilterEntry[] = [];
    if (f.name) entries.push({ label: this.i18n.tUi('groups.list.filters.name'), value: f.name });
    if (f.description) entries.push({ label: this.i18n.tUi('groups.list.filters.description'), value: f.description });
    if (f.createdAt) entries.push({ label: this.i18n.tUi('groups.list.filters.createdAt'), value: f.createdAt });
    if (f.createdBy) entries.push({ label: this.i18n.tUi('groups.list.filters.createdBy'), value: f.createdBy });
    return entries;
  });

  applyFilters(): void {
    this.appliedFilter.set({ ...this.filter() });
  }

  clearFilters(): void {
    this.filter.set(emptyFilter());
    this.appliedFilter.set(emptyFilter());
  }

  updateFilter<K extends keyof GroupsFilterState>(key: K, value: GroupsFilterState[K]): void {
    this.filter.set({ ...this.filter(), [key]: value });
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
