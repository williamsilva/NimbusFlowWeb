import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { ActiveFilterEntry, NbFiltersPanelComponent } from '../shared/filters-panel/nb-filters-panel.component';
import { NbPageHeaderComponent } from '../shared/page-header/nb-page-header.component';
import { NbStatefulListPage } from '../shared/list-base/nb-stateful-list-page';
import { StatusBadgeComponent, StatusTone } from '../shared/status-badge/status-badge.component';
import { Work, WorkService, WorkStatus } from './work.service';
import { WorkCreateDialogComponent } from './work-create-dialog.component';

const STATUS_TONES: Record<WorkStatus, StatusTone> = {
  PLANNED: 'info',
  IN_PROGRESS: 'warn',
  PAUSED: 'neutral',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

interface WorksFilterState {
  search: string;
}

@Component({
  selector: 'app-work-list',
  imports: [
    RouterLink,
    DecimalPipe,
    FormsModule,
    ButtonModule,
    FloatLabelModule,
    InputTextModule,
    TableModule,
    TooltipModule,
    NbFiltersPanelComponent,
    NbPageHeaderComponent,
    StatusBadgeComponent,
    TranslatePipe,
  ],
  templateUrl: './work-list.component.html',
  styleUrl: './work-list.component.scss',
})
export class WorkListComponent extends NbStatefulListPage<WorksFilterState> implements OnInit {
  private readonly workService = inject(WorkService);
  private readonly dialogService = inject(DialogService);
  private readonly authService = inject(AuthService);
  private readonly i18n = inject(I18nService);

  private readonly works = signal<Work[]>([]);
  /** OBRA_MANAGE (Fase 7) - só gateia o botão "Nova obra" (só UX, validação real é 100% backend);
   *  a ação "Gerenciar" fica visível pra todos porque a tela de detalhe também dá acesso a
   *  aditivo/medição/parcela, cada um com seu próprio gate de permissão dentro dela. */
  canManageWorks = false;

  ngOnInit(): void {
    this.initStatefulList();
    this.authService.loadMe().subscribe((user) => (this.canManageWorks = user.permissions.includes('OBRA_MANAGE')));
  }

  protected override refresh(): void {
    this.load();
  }

  protected override tableRowsKey(): string {
    return 'nimbusflow.works.table.rows.v1';
  }

  protected override filtersKey(): string {
    return 'nimbusflow.works.filters.v1';
  }

  protected override emptyFilter(): WorksFilterState {
    return { search: '' };
  }

  protected override buildActiveFilters(f: WorksFilterState): ActiveFilterEntry[] {
    const entries: ActiveFilterEntry[] = [];
    if (f.search) entries.push({ label: this.i18n.tUi('works.list.searchPlaceholder'), value: f.search });
    return entries;
  }

  readonly filteredWorks = computed(() => {
    const term = this.appliedFilter().search.trim().toLowerCase();
    if (!term) return this.works();
    return this.works().filter((work) =>
      [work.name, work.supplierName].some((value) => value.toLowerCase().includes(term)),
    );
  });

  load(): void {
    this.workService.list().subscribe((works) => this.works.set(works));
  }

  openCreate(): void {
    const ref = this.dialogService.open<WorkCreateDialogComponent, void>(WorkCreateDialogComponent, {
      header: this.i18n.tUi('works.createDialog.title'),
      width: '640px',
      modal: true,
    });

    ref?.onClose.subscribe((created) => {
      if (created) {
        this.load();
      }
    });
  }

  statusLabelKey(status: WorkStatus): string {
    return `works.status.${status}`;
  }

  statusTone(status: WorkStatus): StatusTone {
    return STATUS_TONES[status];
  }
}
