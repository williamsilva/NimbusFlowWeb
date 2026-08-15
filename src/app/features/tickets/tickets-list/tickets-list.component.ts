
import { FormsModule } from '@angular/forms';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';

import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { WorksFacade } from '@features/facade/works.facade';
import { TicketsFacade } from '@features/facade/tickets.facade';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TicketsAdvancedFilters } from '@features/filter/tickets.filters';
import { TicketsPermissionPolicy } from '@features/tickets/tickets-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { TICKET_STATUS_VALUES, TicketStatusEnum, ticketStatusTone } from '@models/enums/ticket-status.enum';
import { TICKET_TYPE_VALUES } from '@models/enums/ticket-type.enum';
import { TICKET_PRIORITY_VALUES, ticketPriorityTone } from '@models/enums/ticket-priority.enum';
import { TicketModel, TicketsFiltersState } from '@models/tickets.models';
import { WorkModel } from '@models/works.models';
import { TicketsCreateDialogComponent } from '@features/tickets/tickets-create/tickets-create-dialog.component';
import { TicketsCloseDialogComponent } from '@features/tickets/tickets-close/tickets-close-dialog.component';
import { WorksCreateDialogComponent } from '@features/works/works-create/works-create-dialog.component';
import { ActionPlansCreateDialogComponent } from '@features/action-plans/action-plans-create/action-plans-create-dialog.component';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
import { CsAdvancedPeriodDateFilterComponent } from '@features/list-base/cs-advanced-period-date-filter.component';
import {
  ActiveFilterItem,
  FiltersPanelComponent,
} from '@shared/features/filters-panel/filters-panel.component';
import {
  readSingleFilterValue,
  readArrayFilterValues,
  readDateRangeFilterValue,
} from '@features/list-base/table-filter-readers';

@Component({
  standalone: true,
  selector: 'app-tickets-list',
  templateUrl: './tickets-list.component.html',
  styleUrl: './tickets-list.component.scss',
  imports: [
    CsDatePipe,
    FloatLabel,
    FormsModule,
    SelectModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    TranslateModule,
    DatePickerModule,
    MultiSelectModule,
    ConfirmDialogModule,
    PageHeaderComponent,
    FiltersPanelComponent,
    StatusBadgeComponent,
    TicketsCreateDialogComponent,
    TicketsCloseDialogComponent,
    WorksCreateDialogComponent,
    ActionPlansCreateDialogComponent,
    CsAdvancedPeriodDateFilterComponent,
  ],
})
export class TicketsListComponent extends StatefulListPage<
  TicketsFiltersState,
  TicketsAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(TicketsFacade);
  readonly worksFacade = inject(WorksFacade);
  protected readonly toast = inject(MessageService);
  protected readonly confirm = inject(ConfirmationService);
  protected readonly policy = inject(TicketsPermissionPolicy);
  private readonly destroyRef = inject(DestroyRef);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  title = signal('');
  status = signal<string[] | null>(null);
  types = signal<string[] | null>(null);
  priorities = signal<string[] | null>(null);
  workIds = signal<string[] | null>(null);
  createdAt = signal<string | string[] | null>(null);
  periodCreatedAt = signal<PeriodEnum | null>(null);

  newVisible = signal(false);
  closeTicketId = signal<string | null>(null);
  closeVisible = signal(false);
  convertVisible = signal(false);
  convertingTicket = signal<TicketModel | null>(null);

  /** Chamado em uso no fluxo "abrir Frente de Serviço" (sempre cria uma nova, nunca reaproveita
   *  uma existente) - ver onWorkCreated pra onde é consumido depois que a Frente é criada. */
  workFrontTicketId = signal<string | null>(null);
  createWorkVisible = signal(false);

  readonly statusOptions = TICKET_STATUS_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`tickets.status.${value}` as never),
  }));

  readonly typeOptions = TICKET_TYPE_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`tickets.type.${value}` as never),
  }));

  readonly priorityOptions = TICKET_PRIORITY_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`tickets.priority.${value}` as never),
  }));

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly workOptions = this.worksFacade.options;
  /** Pré-preenche o nome da Frente ao criar uma nova a partir do chamado (ver
   *  WorksCreateDialogComponent#initialName) - deriva do id compartilhado em vez de um signal
   *  próprio, já que workFrontTicketId já identifica o chamado em uso nesse fluxo. */
  readonly workFrontTicketTitle = computed(() => {
    const id = this.workFrontTicketId();
    if (!id) return null;
    return this.tickets().find((t) => t.id === id)?.title ?? null;
  });
  readonly canCreate = computed(() => this.policy.canCreate());
  readonly canManage = computed(() => this.policy.canManage());
  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly tickets = computed<TicketModel[]>(() => this.facade.tickets());

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const title = this.title().trim();
    const status = this.status();
    const types = this.types();
    const priorities = this.priorities();
    const workIds = this.workIds();

    if (title) {
      items.push({ label: this.i18n.tUi('tickets.fields.title'), value: title });
    }
    if (status?.length) {
      const labels = this.statusOptions
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('tickets.fields.status'), value: labels });
    }
    if (types?.length) {
      const labels = this.typeOptions
        .filter((opt) => types.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('tickets.fields.type'), value: labels });
    }
    if (priorities?.length) {
      const labels = this.priorityOptions
        .filter((opt) => priorities.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('tickets.fields.priority'), value: labels });
    }
    if (workIds?.length) {
      const labels = this.workOptions()
        .filter((opt) => workIds.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('tickets.fields.work'), value: labels || workIds.join(', ') });
    }
    const createdAtLabel = this.formatActiveFilterPeriodDateValue(
      this.periodCreatedAt(),
      this.createdAt(),
      this.i18n,
    );
    if (createdAtLabel) {
      items.push({ label: this.i18n.tUi('tickets.fields.createdAt'), value: createdAtLabel });
    }

    return items;
  });

  ngOnInit() {
    this.worksFacade.loadOptions();
    this.initStatefulList();
  }

  tone(status: string): ReturnType<typeof ticketStatusTone> {
    return ticketStatusTone(status);
  }

  priorityTone(priority: string): ReturnType<typeof ticketPriorityTone> {
    return ticketPriorityTone(priority);
  }

  goNew() {
    this.newVisible.set(true);
  }

  onCreated(): void {
    this.refresh();
  }

  onNewVisibleChange(v: boolean) {
    this.newVisible.set(v);
  }

  canClose(row: TicketModel): boolean {
    return (
      this.canManage() &&
      (row.status === TicketStatusEnum.OPEN || row.status === TicketStatusEnum.CONVERTED_TO_ACTION_PLAN)
    );
  }

  canCancel(row: TicketModel): boolean {
    return this.canManage() && row.status === TicketStatusEnum.OPEN;
  }

  /** Não existe endpoint separado de "converter" - criar um Plano de Ação com ticketId JÁ é a
   *  conversão (ver ActionPlanService.create no backend). */
  canConvert(row: TicketModel): boolean {
    return this.canManage() && row.status === TicketStatusEnum.OPEN;
  }

  /** Mesma elegibilidade de canClose - um chamado já convertido em plano ainda pode precisar de
   *  uma Frente de Serviço pra executar (ver TicketService.WORK_LINKABLE_STATUSES no backend).
   *  workId==null pra impedir vincular de novo (trocar) pela UI - o backend ainda aceita
   *  sobrescrever via API direta, restrição é só de tela mesmo. */
  canOpenWorkFront(row: TicketModel): boolean {
    return (
      this.canManage() &&
      row.workId == null &&
      (row.status === TicketStatusEnum.OPEN || row.status === TicketStatusEnum.CONVERTED_TO_ACTION_PLAN)
    );
  }

  goClose(row: TicketModel): void {
    this.closeTicketId.set(row.id);
    this.closeVisible.set(true);
  }

  onCloseVisibleChange(v: boolean): void {
    this.closeVisible.set(v);
    if (!v) this.closeTicketId.set(null);
  }

  onClosed(): void {
    this.refresh();
  }

  goConvert(row: TicketModel): void {
    this.convertingTicket.set(row);
    this.convertVisible.set(true);
  }

  onConvertVisibleChange(v: boolean): void {
    this.convertVisible.set(v);
    if (!v) this.convertingTicket.set(null);
  }

  onConverted(): void {
    this.refresh();
  }

  /** Sempre cria uma Frente nova - usuário não quer reaproveitar uma existente (decisão de
   *  produto, substitui o fluxo anterior que também oferecia vincular a uma Frente já criada). */
  goOpenWorkFront(row: TicketModel): void {
    this.workFrontTicketId.set(row.id);
    this.createWorkVisible.set(true);
  }

  onCreateWorkVisibleChange(v: boolean): void {
    this.createWorkVisible.set(v);
    if (!v) this.workFrontTicketId.set(null);
  }

  /** A Frente acabou de ser criada (WorksCreateDialogComponent) - vincula ela ao chamado que
   *  disparou o fluxo. workFrontTicketId ainda está setado aqui: (created) emite antes de
   *  (visibleChange) no dialog de Frente, que só zera o id (ver onCreateWorkVisibleChange). */
  onWorkCreated(work: WorkModel): void {
    const ticketId = this.workFrontTicketId();
    if (!ticketId) return;

    this.facade
      .linkWork(ticketId, { workId: work.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tickets.action.workLinked' as never),
          });
          this.refresh();
        },
        error: () =>
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tickets.action.workLinkError' as never),
          }),
      });
  }

  confirmCancel(row: TicketModel): void {
    if (!this.canCancel(row)) return;

    this.confirm.confirm({
      key: 'tickets',
      header: this.i18n.tUi('tickets.cancelConfirm.header'),
      message: this.i18n.tUi('tickets.cancelConfirm.message'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.facade
          .cancel(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('tickets.status.cancelled' as never),
              }),
            error: () =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail: this.i18n.tUi('tickets.status.cancelError' as never),
              }),
          });
      },
    });
  }

  clear() {
    this.clearTableAndReload(this.dt);
  }

  protected formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(this.i18n.getLang(), { dateStyle: 'short' }).format(date);
  }

  protected override tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.TICKETS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.TICKETS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.TICKETS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.title.set('');
    this.status.set(null);
    this.types.set(null);
    this.priorities.set(null);
    this.workIds.set(null);
    this.createdAt.set(null);
    this.periodCreatedAt.set(null);
  }

  protected override toFiltersState(): TicketsFiltersState {
    return {
      title: this.title(),
      status: this.status()?.length ? this.status() : null,
      types: this.types()?.length ? this.types() : null,
      priorities: this.priorities()?.length ? this.priorities() : null,
      workIds: this.workIds()?.length ? this.workIds() : null,
      createdAt: this.createdAt(),
      periodCreatedAt: this.periodCreatedAt(),
    };
  }

  protected override applyFiltersState(state: TicketsFiltersState): void {
    this.title.set(state.title ?? '');
    this.status.set(state.status ?? null);
    this.types.set(state.types ?? null);
    this.priorities.set(state.priorities ?? null);
    this.workIds.set(state.workIds ?? null);
    this.createdAt.set(state.createdAt ?? null);
    this.periodCreatedAt.set(state.periodCreatedAt ?? null);
  }

  protected override buildAdvancedFilters(): Partial<TicketsAdvancedFilters> {
    return {
      title: this.title().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      types: this.types()?.length ? this.types() : undefined,
      priorities: this.priorities()?.length ? this.priorities() : undefined,
      workIds: this.workIds()?.length ? this.workIds() : undefined,
      createdAt: this.createdAt() ?? undefined,
      periodCreatedAt: this.periodCreatedAt() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const title = readSingleFilterValue(filters, 'title');
    if (title) {
      items.push({ label: this.i18n.tUi('tickets.fields.title'), value: title });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('tickets.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const createdAt = readDateRangeFilterValue(filters, 'createdAt', this.formatDate.bind(this));
    if (createdAt) {
      items.push({ label: this.i18n.tUi('tickets.fields.createdAt'), value: createdAt });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<TicketsAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}
