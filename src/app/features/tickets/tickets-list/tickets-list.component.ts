
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, computed, inject, signal, OnInit } from '@angular/core';

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
import { PaginatorModule, PaginatorState } from 'primeng/paginator';

import { I18nService } from '@core/i18n/i18n.service';
import { STATE_KEY } from '@features/state-key.constants';
import { UsersFacade } from '@features/facade/users.facade';
import { TicketsFacade } from '@features/facade/tickets.facade';
import { DepartmentsFacade } from '@features/facade/departments.facade';
import { StatefulListPage } from '@williamsilva/nimbus-web-commons';
import { buildListQuery } from '@williamsilva/nimbus-web-commons';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TicketsAdvancedFilters } from '@features/filter/tickets.filters';
import { TicketsPermissionPolicy } from '@features/tickets/tickets-permission.policy';
import { WorksPermissionPolicy } from '@features/works/works-permission.policy';
import { ActionPlansPermissionPolicy } from '@features/action-plans/action-plans-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { TICKET_STATUS_VALUES, TicketStatusEnum, ticketStatusTone } from '@models/enums/ticket-status.enum';
import { TICKET_TYPE_VALUES } from '@models/enums/ticket-type.enum';
import { TICKET_TARGET_TYPE_VALUES } from '@models/enums/ticket-target-type.enum';
import { TICKET_PRIORITY_VALUES, ticketPriorityTone } from '@models/enums/ticket-priority.enum';
import { TicketModel, TicketsFiltersState, formatTicketNumero } from '@models/tickets.models';
import { CompanySettingsApiService } from '@features/service/company-settings.api.service';
import { CompanySettingsModel } from '@models/company-settings.models';
import { WorkModel } from '@models/works.models';
import { TicketsCreateDialogComponent } from '@features/tickets/tickets-create/tickets-create-dialog.component';
import { WorksCreateDialogComponent } from '@features/works/works-create/works-create-dialog.component';
import { ActionPlansCreateDialogComponent } from '@features/action-plans/action-plans-create/action-plans-create-dialog.component';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
import { CsAdvancedPeriodDateFilterComponent } from '@williamsilva/nimbus-web-commons';
import {
  ActiveFilterItem,
  FiltersPanelComponent,
} from '@williamsilva/nimbus-web-commons';
import {
  readSingleFilterValue,
  readArrayFilterValues,
  readDateRangeFilterValue,
} from '@williamsilva/nimbus-web-commons';

@Component({
  standalone: true,
  selector: 'app-tickets-list',
  templateUrl: './tickets-list.component.html',
  styleUrl: './tickets-list.component.scss',
  imports: [
    FloatLabel,
    FormsModule,
    SelectModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    TranslateModule,
    DatePickerModule,
    MultiSelectModule,
    ConfirmDialogModule,
    PaginatorModule,
    PageHeaderComponent,
    FiltersPanelComponent,
    StatusBadgeComponent,
    TicketsCreateDialogComponent,
    WorksCreateDialogComponent,
    ActionPlansCreateDialogComponent,
    CsAdvancedPeriodDateFilterComponent,
  ],
})
export class TicketsListComponent extends StatefulListPage<
  TicketsFiltersState,
  TicketsAdvancedFilters
> implements OnInit {
  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(TicketsFacade);
  readonly usersFacade = inject(UsersFacade);
  readonly departmentsFacade = inject(DepartmentsFacade);
  protected readonly toast = inject(MessageService);
  protected readonly confirm = inject(ConfirmationService);
  protected readonly policy = inject(TicketsPermissionPolicy);
  protected readonly worksPolicy = inject(WorksPermissionPolicy);
  protected readonly actionPlansPolicy = inject(ActionPlansPermissionPolicy);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly companyApi = inject(CompanySettingsApiService);

  /** Config única de empresa (mesmo padrão do cabeçalho de TicketDetailComponent) - mostrada
   *  como "{numero} - {nome}" no cartão da lista (pedido do usuário 2026-09-20). */
  readonly company = signal<CompanySettingsModel | null>(null);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  title = signal('');
  status = signal<string[] | null>(this.defaultStatus());
  types = signal<string[] | null>(null);
  priorities = signal<string[] | null>(null);
  targetDepartmentIds = signal<string[] | null>(null);
  targetUserIds = signal<string[] | null>(null);
  createdAt = signal<string | string[] | null>(null);
  periodCreatedAt = signal<PeriodEnum | null>(null);

  newVisible = signal(false);
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

  /** Filtro por coluna de "Direcionado para" (th-icons) - sem contrapartida no painel de filtros
   *  avançados, diferente de status/type/priority (decisão de escopo: só a coluna, ver pedido do
   *  usuário). */
  readonly targetTypeOptions = TICKET_TARGET_TYPE_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`tickets.targetType.${value}` as never),
  }));

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly departmentOptions = this.departmentsFacade.options;
  readonly userOptions = this.usersFacade.options;
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
    const targetDepartmentIds = this.targetDepartmentIds();
    if (targetDepartmentIds?.length) {
      const labels = this.departmentOptions()
        .filter((opt) => targetDepartmentIds.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('tickets.fields.targetDepartment'), value: labels || targetDepartmentIds.join(', ') });
    }
    const targetUserIds = this.targetUserIds();
    if (targetUserIds?.length) {
      const labels = this.userOptions()
        .filter((opt) => targetUserIds.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('tickets.fields.targetUser'), value: labels || targetUserIds.join(', ') });
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
    this.departmentsFacade.loadOptions();
    this.usersFacade.loadUsersOptions();
    this.initStatefulList();
    this.companyApi
      .getDisplaySettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (c) => this.company.set(c) });
  }

  /** "Aberto" + "Em andamento" pré-selecionados, mas só quando o painel de filtros está vazio de
   *  verdade (nem restaurado do localStorage, nem definido pelo usuário) - pedido do usuário
   *  2026-09-21, mesmo padrão de WorksListComponent#defaultStatus (ver
   *  applyDefaultAdvancedFiltersIfEmpty em StatefulListPage). */
  private defaultStatus(): string[] {
    return [TicketStatusEnum.OPEN, TicketStatusEnum.IN_PROGRESS];
  }

  protected override applyDefaultAdvancedFilters(): void {
    this.status.set(this.defaultStatus());
  }

  tone(status: string): ReturnType<typeof ticketStatusTone> {
    return ticketStatusTone(status);
  }

  priorityTone(priority: string): ReturnType<typeof ticketPriorityTone> {
    return ticketPriorityTone(priority);
  }

  /** Cor de destaque do cartão por status (mesma paleta do app-status-badge) - pedido do usuário
   *  2026-09-20: "borda com detalhes coloridos" pra diferenciar 1 cartão do outro de relance. */
  private static readonly ACCENT_COLOR: Record<string, string> = {
    success: '#22c55e',
    info: '#3b82f6',
    warn: '#f59e0b',
    danger: '#ef4444',
    neutral: '#94a3b8',
  };

  cardAccentColor(status: string): string {
    return TicketsListComponent.ACCENT_COLOR[this.tone(status)] ?? TicketsListComponent.ACCENT_COLOR['neutral'];
  }

  /** "Direcionado para" - usuário ou departamento, mutuamente exclusivos (ver
   *  TicketService#resolveTarget no backend). Reaproveitado no ícone (mobile) e no avatar
   *  (desktop, pedido do usuário 2026-09-20). */
  responsavelName(row: TicketModel): string | null {
    return row.targetType === 'USER' ? row.targetUserName : row.targetDepartmentName;
  }

  /** 2 primeiras letras do nome (usuário ou departamento) - pedido explícito do usuário
   *  2026-09-20, não "1ª letra de até 2 palavras" (a maioria dos departamentos é 1 palavra só,
   *  ex.: "Manutenção" -> "MA"). */
  initials(name: string | null): string {
    const trimmed = name?.trim();
    if (!trimmed) return '?';
    return trimmed.slice(0, 2).toUpperCase();
  }

  /** Cor do avatar por hash simples do nome - mesmo nome sempre cai na mesma cor, paleta fixa
   *  (pedido do usuário 2026-09-20, print de referência com avatares coloridos). */
  private static readonly AVATAR_PALETTE = [
    '#7c3aed',
    '#0891b2',
    '#059669',
    '#d97706',
    '#dc2626',
    '#4f46e5',
    '#0d9488',
    '#65a30d',
  ];

  avatarColor(name: string | null): string {
    if (!name) return TicketsListComponent.AVATAR_PALETTE[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return TicketsListComponent.AVATAR_PALETTE[hash % TicketsListComponent.AVATAR_PALETTE.length];
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

  /** OPEN e IN_PROGRESS contam como "ainda ativo" (mesmo racional de OPEN_LIKE_STATUSES no
   *  backend) - pedido do usuário 2026-09-19 (status novo "Em andamento"). */
  private isOpenLike(row: TicketModel): boolean {
    return row.status === TicketStatusEnum.OPEN || row.status === TicketStatusEnum.IN_PROGRESS;
  }

  goDetail(row: TicketModel): void {
    void this.router.navigate(['/tickets', row.id]);
  }

  formatNumero(numero: number): string {
    return formatTicketNumero(numero);
  }

  /** Sem <p-table> não tem mais restauração automática de estado (stateStorage="local") - só o
   *  necessário pro cartão (página atual) fica guardado, sort/filtro de coluna nunca existiram
   *  fora do próprio painel "Filtrar" (ver mapTableFiltersToActiveItems). */
  paginatorFirst(): number {
    return this.lastLazyEvent?.first ?? 0;
  }

  onCardPageChange(event: PaginatorState): void {
    const rows = event.rows ?? this.rows;
    const first = event.first ?? 0;
    this.rows = rows;
    localStorage.setItem(this.tableRowsKey(), String(this.rows));
    this.lastLazyEvent = { ...(this.lastLazyEvent ?? {}), first, rows };
    localStorage.setItem(this.tableStateKey(), JSON.stringify({ first, rows }));
    this.reloadWithCurrentState();
  }

  /** CHAMADO_CANCEL dedicada, não CHAMADO_MANAGE (achado real 2026-09-19, pedido do usuário:
   *  grupo Operacional pode editar/fechar chamados mas não deve poder cancelar). */
  canCancel(row: TicketModel): boolean {
    return this.policy.canCancel() && row.workId == null && this.isOpenLike(row);
  }

  /** Não existe endpoint separado de "converter" - criar um Plano de Ação com ticketId JÁ é a
   *  conversão (ver ActionPlanService.create no backend), que exige PLANO_ACAO_MANAGE - não
   *  CHAMADO_MANAGE. Sem esse segundo check aqui, um usuário só com CHAMADO_MANAGE via
   *  Operacional (achado real 2026-09-19, pedido do usuário) via até o diálogo de conversão e só
   *  levava um 403 do backend ao salvar - a tela não devia nem oferecer a ação. */
  canConvert(row: TicketModel): boolean {
    return (
      this.canManage() &&
      this.actionPlansPolicy.canManage() &&
      row.workId == null &&
      this.isOpenLike(row)
    );
  }

  /** As duas conversões (Frente/Plano de Ação) são mutuamente exclusivas (pedido do usuário
   *  2026-09-21) - um chamado já convertido em plano NÃO pode mais abrir Frente de Serviço (nem
   *  o contrário, ver canConvert). row.workId == null porque, uma vez vinculado, o chamado fica
   *  bloqueado (ver TicketDetailComponent) - o próprio backend rejeita vincular de novo sem
   *  desfazer antes (TicketService.linkWork), não é só restrição de tela. Exige também
   *  OBRA_MANAGE (não só CHAMADO_MANAGE) - abrir Frente de Serviço cria uma Work de verdade
   *  (WorkService.create exige OBRA_MANAGE) e o próprio TicketService.linkWork passou a exigir
   *  OBRA_MANAGE também (achado real 2026-09-19, pedido do usuário: grupo Operacional não pode
   *  abrir Frente de Serviço a partir de um chamado). */
  canOpenWorkFront(row: TicketModel): boolean {
    return this.canManage() && this.worksPolicy.canManage() && row.workId == null && this.isOpenLike(row);
  }

  /** "Desfazer Frente de Serviço" - solta o vínculo e libera o chamado pra edição/fechamento/
   *  cancelamento/conversão direto de novo (ver TicketService.unlinkWork no backend). Um chamado
   *  com workId != null está sempre em CONVERTED_TO_WORK (ver TicketService.linkWork, pedido do
   *  usuário 2026-09-21 - antes vincular não mudava o status nenhum). */
  canUnlinkWork(row: TicketModel): boolean {
    return this.canManage() && row.workId != null && row.status === TicketStatusEnum.CONVERTED_TO_WORK;
  }

  /** Toggle do botão "Converter em plano"/"Desfazer conversão" no card (ver template) - baseado
   *  só no status, não em canUnlinkActionPlan/canConvert (que também checam permissão): senão um
   *  usuário sem permissão veria o botão errado (ex.: "Converter" desabilitado num chamado que já
   *  foi convertido) em vez do botão certo, só que desabilitado. Um chamado com actionPlanId
   *  != null mas já CONVERTED_TO_WORK (convertido em plano e DEPOIS vinculado a uma Frente, ver
   *  TicketService.WORK_LINKABLE_STATUSES no backend) não conta - nesse caso quem manda é o botão
   *  de Frente. */
  isConvertedToActionPlan(row: TicketModel): boolean {
    return row.status === TicketStatusEnum.CONVERTED_TO_ACTION_PLAN;
  }

  /** "Desfazer conversão em Plano de Ação" - simétrico a canUnlinkWork acima (pedido do usuário
   *  2026-09-21). Gate CHAMADO_MANAGE só, mesma decisão já tomada pra unlinkWork (ver
   *  ActionPlanService.unlinkFromTicket no backend: desfazer pertence ao fluxo do Chamado, não à
   *  gestão do Plano em si). */
  canUnlinkActionPlan(row: TicketModel): boolean {
    return this.canManage() && this.isConvertedToActionPlan(row);
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

  confirmUnlinkWork(row: TicketModel): void {
    if (!this.canUnlinkWork(row)) return;

    this.confirm.confirm({
      key: 'tickets',
      header: this.i18n.tUi('tickets.unlinkWorkConfirm.header' as never),
      message: this.i18n.tUi('tickets.unlinkWorkConfirm.message' as never, { workName: row.workName ?? '' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.facade
          .unlinkWork(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('tickets.unlinkWorkConfirm.success' as never),
              }),
            error: () =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail: this.i18n.tUi('tickets.unlinkWorkConfirm.error' as never),
              }),
          });
      },
    });
  }

  confirmUnlinkActionPlan(row: TicketModel): void {
    if (!this.canUnlinkActionPlan(row)) return;

    this.confirm.confirm({
      key: 'tickets',
      header: this.i18n.tUi('tickets.unlinkActionPlanConfirm.header' as never),
      message: this.i18n.tUi('tickets.unlinkActionPlanConfirm.message' as never),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.facade
          .unlinkActionPlan(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () =>
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('tickets.unlinkActionPlanConfirm.success' as never),
              }),
            error: () =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail: this.i18n.tUi('tickets.unlinkActionPlanConfirm.error' as never),
              }),
          });
      },
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
    this.clearTableAndReload();
  }

  /** Da abertura (createdAt) até o fechamento (closedAt) - closedAt também é preenchido ao
   *  cancelar (ver TicketService#cancel no backend), então aparece pra CLOSED e CANCELLED, não só
   *  CLOSED. Enquanto ainda aberto (closedAt nulo), mostra o tempo decorrido até agora em vez de
   *  "-" - recalculado a cada change detection (sem timer próprio, mesmo espírito de formatDate
   *  abaixo), então só atualiza de fato num refresh/nova carga da lista, não a cada segundo. */
  protected ticketDuration(row: TicketModel): string {
    if (!row.createdAt) return '-';

    const end = row.closedAt ? new Date(row.closedAt).getTime() : Date.now();
    const diffMs = end - new Date(row.createdAt).getTime();
    if (!Number.isFinite(diffMs) || diffMs < 0) return '-';

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return `${days}d ${hours}h`;
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
    this.targetDepartmentIds.set(null);
    this.targetUserIds.set(null);
    this.createdAt.set(null);
    this.periodCreatedAt.set(null);
    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override toFiltersState(): TicketsFiltersState {
    return {
      title: this.title(),
      status: this.status()?.length ? this.status() : null,
      types: this.types()?.length ? this.types() : null,
      priorities: this.priorities()?.length ? this.priorities() : null,
      targetDepartmentIds: this.targetDepartmentIds()?.length ? this.targetDepartmentIds() : null,
      targetUserIds: this.targetUserIds()?.length ? this.targetUserIds() : null,
      createdAt: this.createdAt(),
      periodCreatedAt: this.periodCreatedAt(),
    };
  }

  protected override applyFiltersState(state: TicketsFiltersState): void {
    this.title.set(state.title ?? '');
    this.status.set(state.status ?? null);
    this.types.set(state.types ?? null);
    this.priorities.set(state.priorities ?? null);
    this.targetDepartmentIds.set(state.targetDepartmentIds ?? null);
    this.targetUserIds.set(state.targetUserIds ?? null);
    this.createdAt.set(state.createdAt ?? null);
    this.periodCreatedAt.set(state.periodCreatedAt ?? null);

    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override buildAdvancedFilters(): Partial<TicketsAdvancedFilters> {
    return {
      title: this.title().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      types: this.types()?.length ? this.types() : undefined,
      priorities: this.priorities()?.length ? this.priorities() : undefined,
      targetDepartmentIds: this.targetDepartmentIds()?.length ? this.targetDepartmentIds() : undefined,
      targetUserIds: this.targetUserIds()?.length ? this.targetUserIds() : undefined,
      createdAt: this.createdAt() ?? undefined,
      periodCreatedAt: this.periodCreatedAt() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: Record<string, unknown>): ActiveFilterItem[] {
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

    const targetTypeValues = readArrayFilterValues(filters, 'targetType');
    if (targetTypeValues.length) {
      const labels = this.targetTypeOptions
        .filter((option) => targetTypeValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('tickets.fields.targetType'),
        value: (labels.length ? labels : targetTypeValues).join(', '),
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

  // reload dessa lista
  // já é disparado pelo effect() de filtros da própria StatefulListPage, não precisa de
  // lógica extra aqui.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected override loadFirstPage(): void {}
}
