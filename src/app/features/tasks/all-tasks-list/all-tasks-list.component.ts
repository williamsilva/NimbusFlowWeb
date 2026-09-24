
import { FormsModule } from '@angular/forms';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, ViewChild, computed, inject, signal, OnInit } from '@angular/core';

import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService, ConfirmationService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { UsersFacade } from '@features/facade/users.facade';
import { PermissionService } from '@core/auth/permission.service';
import { DepartmentsFacade } from '@features/facade/departments.facade';
import { TaskLocationsFacade } from '@features/facade/task-locations.facade';
import { TasksGlobalFacade, TaskBatchResult } from '@features/facade/tasks-global.facade';
import { StatefulListPage } from '@williamsilva/nimbus-web-commons';
import { buildListQuery } from '@williamsilva/nimbus-web-commons';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TasksAdvancedFilters } from '@features/filter/tasks.filters';
import { TasksPermissionPolicy } from '@features/tasks/tasks-permission.policy';
import { translateTasksErrorDetail } from '@features/tasks/tasks-error.util';
import {
  TaskKanbanDropEvent,
  TasksKanbanBoardComponent,
} from '@features/tasks/tasks-kanban-board/tasks-kanban-board.component';
import { TasksCreateDialogComponent } from '@features/tasks/tasks-create/tasks-create-dialog.component';
import { TaskCreationChoiceDialogComponent } from '@features/tasks/tasks-create/task-creation-choice-dialog.component';
import {
  TaskTemplatePickerDialogComponent,
  TaskTemplateBatchRequest,
} from '@features/tasks/tasks-create/task-template-picker-dialog.component';
import { TaskExecutionDialogComponent } from '@features/tasks/tasks-execution/task-execution-dialog.component';
import { TaskTemplateModel } from '@models/task-templates.models';
import { allActivitiesAnswered, toActivityDraftFromConfig, toActivityInput } from '@models/task-activities.models';
import {
  TASK_STATUS_VALUES,
  TaskStatusEnum,
  nextForwardTaskStatus,
} from '@models/enums/task-status.enum';
import {
  TaskAssigneeTypeEnum,
  TASK_ASSIGNEE_TYPE_VALUES,
  taskAssigneeTypeLabel,
} from '@models/enums/task-assignee-type.enum';
import { TASK_SHIFT_VALUES, TaskShiftEnum, taskShiftLabel } from '@models/enums/task-shift.enum';
import { TaskRecurrenceFrequencyEnum } from '@models/enums/task-recurrence-frequency.enum';
import {
  TaskAssigneeInput,
  TaskUpsertInput,
  TaskWithActionPlanModel,
  TasksFiltersState,
  formatTaskNumero,
  taskAssigneeDisplayName,
} from '@models/tasks.models';
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

/** Mesma técnica de toDateOnlyString em TasksCreateDialogComponent, só que sempre "agora" - usada
 *  pra dar um prazo padrão (hoje) às tarefas geradas em lote a partir de um Modelo, ver
 *  #onBatchCreateRequested. */
function todayDateOnlyString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Component({
  standalone: true,
  selector: 'app-all-tasks-list',
  templateUrl: './all-tasks-list.component.html',
  styleUrl: './all-tasks-list.component.scss',
  imports: [
    CsDatePipe,
    FloatLabel,
    FormsModule,
    SelectModule,
    TableModule,
    DialogModule,
    ButtonModule,
    TooltipModule,
    TextareaModule,
    SelectButtonModule,
    InputTextModule,
    TranslateModule,
    DatePickerModule,
    MultiSelectModule,
    PageHeaderComponent,
    FiltersPanelComponent,
    TasksKanbanBoardComponent,
    TasksCreateDialogComponent,
    TaskCreationChoiceDialogComponent,
    TaskTemplatePickerDialogComponent,
    TaskExecutionDialogComponent,
    CsAdvancedPeriodDateFilterComponent,
  ],
})
export class AllTasksListComponent extends StatefulListPage<TasksFiltersState, TasksAdvancedFilters> implements OnInit {
  @ViewChild('dt') private dt?: Table;

  protected override readonly i18n = inject(I18nService);
  readonly facade = inject(TasksGlobalFacade);
  readonly usersFacade = inject(UsersFacade);
  readonly departmentsFacade = inject(DepartmentsFacade);
  readonly taskLocationsFacade = inject(TaskLocationsFacade);
  protected readonly toast = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  protected readonly policy = inject(TasksPermissionPolicy);
  private readonly perms = inject(PermissionService);
  private readonly destroyRef = inject(DestroyRef);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  /** Tamanho de página bem maior no Kanban (pedido do usuário 2026-09-21) - diferente da tabela,
   *  paginada por natureza, o quadro precisa ver as tarefas de cada coluna de uma vez. Sem
   *  paginação própria por coluna por simplicidade - suficiente pro volume desta empresa. */
  private static readonly KANBAN_PAGE_SIZE = 500;

  readonly viewMode = signal<'list' | 'kanban'>(
    (localStorage.getItem(STATE_KEY.NIMBUSFLOW.WORKS.ALL_TASKS.VIEW_MODE.V1) as 'list' | 'kanban' | null) ??
      'list',
  );

  readonly viewModeOptions: { label: string; value: 'list' | 'kanban' }[] = [
    { label: this.i18n.tUi('tasks.viewMode.kanban' as never), value: 'kanban' },
    { label: this.i18n.tUi('tasks.viewMode.list' as never), value: 'list' },
  ];

  upsertVisible = signal(false);
  /** Nulo = criando; preenchido = editando (pedido do usuário 2026-09-23 - botão de lápis do
   *  cartão do Kanban abre a edição, mesmo diálogo reaproveitado de criar). */
  editingTask = signal<TaskWithActionPlanModel | null>(null);

  /** "O que você deseja fazer?" (pedido do usuário 2026-09-24) - primeiro passo do "+ Nova
   *  Tarefa", antes de abrir o diálogo de criação de verdade (ver #goNew/#onChooseBlank/
   *  #onChooseFromTemplate). Só se aplica à CRIAÇÃO - o lápis do Kanban (edição) continua abrindo
   *  app-tasks-create-dialog direto, sem passar por aqui. */
  choiceDialogVisible = signal(false);
  pickerDialogVisible = signal(false);
  templateToPrefill = signal<TaskTemplateModel | null>(null);

  /** Tela de execução (pedido do usuário 2026-09-23) - clicar no resto do cartão do Kanban abre
   *  isto, diferente do botão de lápis (edição, ver editingTask acima). */
  executionDialogVisible = signal(false);
  executingTask = signal<TaskWithActionPlanModel | null>(null);

  title = signal('');
  status = signal<string[] | null>(null);
  assigneeIds = signal<string[] | null>(null);
  departmentIds = signal<string[] | null>(null);
  locationIds = signal<string[] | null>(null);
  shift = signal<string[] | null>(null);
  createdAt = signal<string | string[] | null>(null);
  periodCreatedAt = signal<PeriodEnum | null>(null);

  readonly statusOptions = TASK_STATUS_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`tasks.status.${value}` as never),
  }));

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly assigneeOptions = this.usersFacade.options;
  readonly departmentOptions = this.departmentsFacade.options;
  readonly locationOptions = this.taskLocationsFacade.options;
  readonly shiftFilterOptions = TASK_SHIFT_VALUES.map((value) => ({
    value,
    label: taskShiftLabel(value, this.i18n),
  }));
  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly tasks = computed<TaskWithActionPlanModel[]>(() => this.facade.tasks());

  /** Aba ativa da visualização em Lista (pedido do usuário 2026-09-23, "igual ao print") - cada
   *  aba É um status, sempre exatamente um por vez; diferente do multiSelect "status" do painel de
   *  filtros avançados acima, que só é exibido/aplicado no Kanban (ver template/buildAdvancedFilters
   *  - lá sim faz sentido combinar vários status de uma vez, já que o quadro mostra todos juntos).
   *  Não é persistido (sempre volta pra "A fazer" ao recarregar a página) - simplicidade
   *  deliberada, evita migrar o schema já salvo de TasksFiltersState no localStorage dos usuários. */
  readonly activeStatusTab = signal<TaskStatusEnum>(TaskStatusEnum.TODO);
  readonly statusTabs = TASK_STATUS_VALUES;

  /** Seleção em lote (pedido do usuário 2026-09-23, "igual ao print") - checkbox por linha,
   *  mesma técnica de AllMeasurementsListComponent (dataKey="id" + PrimeNG reconciliando quem
   *  está marcado). Só faz sentido pra quem tem TAREFA_MANAGE (ver template), já que as duas
   *  ações em lote (Alterar status/Transferir) exigem essa permissão no backend. */
  readonly selection = signal<TaskWithActionPlanModel[]>([]);
  readonly bulkBusy = signal(false);

  readonly changeStatusDialogVisible = signal(false);
  readonly transferDialogVisible = signal(false);

  /** Justificativa obrigatória de "Não fez" (pedido do usuário 2026-09-23) - segundo passo do
   *  mesmo fluxo de "Alterar status", tanto pelo botão em lote quanto por um drop no Kanban (ver
   *  #requestStatusChange, ponto único de entrada dos dois). `pendingStatusChangeTaskIds` guarda
   *  pra quais tarefas aplicar quando o usuário confirmar o texto. */
  readonly notDoneJustificationVisible = signal(false);
  readonly notDoneJustificationText = signal('');
  readonly pendingStatusChangeTaskIds = signal<string[]>([]);
  readonly transferAssigneeType = signal<TaskAssigneeTypeEnum>(TaskAssigneeTypeEnum.USER);
  readonly transferAssigneeId = signal<string | null>(null);
  readonly transferAssigneeDepartmentId = signal<string | null>(null);

  readonly assigneeTypeOptions = TASK_ASSIGNEE_TYPE_VALUES.map((value) => ({
    value,
    label: taskAssigneeTypeLabel(value, this.i18n),
  }));

  readonly TaskAssigneeTypeEnum = TaskAssigneeTypeEnum;

  /** Só CANCELLED/NOT_DONE (pedido do usuário 2026-09-23, "igual ao print" - o diálogo só mostra
   *  essas duas opções, nunca "Em andamento" etc.): transições "pra frente" já têm o botão
   *  individual "Avançar status"/aprovação pra isso, um salto em lote não se aplicaria a todas as
   *  selecionadas por igual (dependem de cada tarefa estar exatamente no passo anterior).
   *  CANCELLED/NOT_DONE, ao contrário, são sempre válidas de QUALQUER status via TAREFA_MANAGE
   *  (nenhuma das duas regras duras do backend as restringe) - por isso são as únicas oferecidas,
   *  sempre as mesmas duas, só excluindo a que já é a aba atual. */
  readonly bulkStatusOptions = computed(() =>
    [TaskStatusEnum.CANCELLED, TaskStatusEnum.NOT_DONE].filter((s) => s !== this.activeStatusTab()),
  );

  readonly canConfirmTransfer = computed(() =>
    this.transferAssigneeType() === TaskAssigneeTypeEnum.USER
      ? !!this.transferAssigneeId()
      : !!this.transferAssigneeDepartmentId(),
  );

  readonly canConfirmNotDoneJustification = computed(() => this.notDoneJustificationText().trim().length > 0);

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const title = this.title().trim();
    const status = this.status();
    const assigneeIds = this.assigneeIds();
    const departmentIds = this.departmentIds();
    const locationIds = this.locationIds();
    const shift = this.shift();

    if (title) {
      items.push({ label: this.i18n.tUi('tasks.fields.title'), value: title });
    }
    // "status" só é um filtro de verdade no Kanban (pedido do usuário 2026-09-23) - na Lista
    // quem decide o status é a aba ativa (activeStatusTab), não este multiSelect (ver template/
    // buildAdvancedFilters), então não faz sentido contar como filtro "ativo" aqui.
    if (this.viewMode() === 'kanban' && status?.length) {
      const labels = this.statusOptions
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('tasks.fields.status'), value: labels });
    }
    if (assigneeIds?.length) {
      const labels = this.assigneeOptions()
        .filter((opt) => assigneeIds.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({
        label: this.i18n.tUi('tasks.fields.assignee'),
        value: labels || assigneeIds.join(', '),
      });
    }
    if (departmentIds?.length) {
      const labels = this.departmentOptions()
        .filter((opt) => departmentIds.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({
        label: this.i18n.tUi('tasks.fields.assigneeDepartment'),
        value: labels || departmentIds.join(', '),
      });
    }
    if (locationIds?.length) {
      const labels = this.locationOptions()
        .filter((opt) => locationIds.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({
        label: this.i18n.tUi('tasks.fields.location'),
        value: labels || locationIds.join(', '),
      });
    }
    if (shift?.length) {
      const labels = this.shiftFilterOptions
        .filter((opt) => shift.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('tasks.fields.shift'), value: labels });
    }
    const createdAtLabel = this.formatActiveFilterPeriodDateValue(
      this.periodCreatedAt(),
      this.createdAt(),
      this.i18n,
    );
    if (createdAtLabel) {
      items.push({ label: this.i18n.tUi('tasks.fields.createdAt'), value: createdAtLabel });
    }

    return items;
  });

  ngOnInit() {
    this.usersFacade.loadUsersOptions();
    this.departmentsFacade.loadOptions();
    this.taskLocationsFacade.loadOptions();
    // initStatefulList() -> loadOnInit() -> this.refresh() (ver StatefulListPage na lib) já cobre
    // o boot direto em modo kanban sozinho, via o próprio override de refresh() logo abaixo - uma
    // chamada extra e redundante aqui só arriscava confundir (competindo com esta, bloqueada pelo
    // guard de loading do facade). Uma única chamada, um único caminho.
    this.initStatefulList();
  }

  formatNumero(numero: number): string {
    return formatTaskNumero(numero);
  }

  /** Troca de aba (pedido do usuário 2026-09-23) - cada aba é um status; muda activeStatusTab
   *  (lido por #buildAdvancedFilters) e recarrega. Seleção em lote é limpa - os checkboxes eram
   *  de tarefas de OUTRO status, não fazem mais sentido na tabela nova. */
  selectStatusTab(status: TaskStatusEnum): void {
    if (this.activeStatusTab() === status) return;
    this.activeStatusTab.set(status);
    this.selection.set([]);
    this.search();
  }

  onSelectionChange(selection: TaskWithActionPlanModel[]): void {
    this.selection.set(selection);
  }

  openChangeStatusDialog(): void {
    if (!this.selection().length) return;
    this.changeStatusDialogVisible.set(true);
  }

  closeChangeStatusDialog(): void {
    this.changeStatusDialogVisible.set(false);
  }

  /** Clique na opção da lista do diálogo "Alterar status" (pedido do usuário 2026-09-23) - não
   *  executa mais direto, passa por #requestStatusChange (mesmo ponto de entrada usado pelo drop
   *  no Kanban) pra aplicar confirmação/justificativa antes. */
  applyBulkStatusChange(status: TaskStatusEnum): void {
    this.requestStatusChange(
      this.selection().map((t) => t.id),
      status,
    );
  }

  /** Ponto único de entrada pra qualquer mudança de status que possa terminar em
   *  CANCELLED/NOT_DONE (pedido do usuário 2026-09-23) - usado tanto pelo diálogo "Alterar
   *  status" (lista de escolhas em lote) quanto por um drop no Kanban (uma única tarefa). CANCELLED
   *  pede confirmação simples (mesmo padrão de TicketsListComponent#confirm cancelamento de
   *  chamado); NOT_DONE pede justificativa de verdade, texto obrigatório (backend rejeita sem
   *  isso, ver TaskService#updateStatus) - outros status seguem direto, sem gate nenhum aqui. */
  private requestStatusChange(taskIds: string[], status: TaskStatusEnum): void {
    if (!taskIds.length) return;

    if (status === TaskStatusEnum.CANCELLED) {
      this.changeStatusDialogVisible.set(false);
      this.confirmationService.confirm({
        icon: 'pi pi-exclamation-triangle',
        header: this.i18n.tUi('tasks.bulk.cancelConfirmHeader' as never),
        message: this.i18n.tUi('tasks.bulk.cancelConfirmMessage' as never, { count: taskIds.length }),
        accept: () => this.executeStatusChange(taskIds, status, null),
      });
      return;
    }

    if (status === TaskStatusEnum.NOT_DONE) {
      this.changeStatusDialogVisible.set(false);
      this.pendingStatusChangeTaskIds.set(taskIds);
      this.notDoneJustificationText.set('');
      this.notDoneJustificationVisible.set(true);
      return;
    }

    this.executeStatusChange(taskIds, status, null);
  }

  closeNotDoneJustification(): void {
    this.notDoneJustificationVisible.set(false);
    this.pendingStatusChangeTaskIds.set([]);
  }

  confirmNotDoneJustification(): void {
    const reason = this.notDoneJustificationText().trim();
    if (!reason || this.bulkBusy()) return;

    const ids = this.pendingStatusChangeTaskIds();
    this.notDoneJustificationVisible.set(false);
    this.executeStatusChange(ids, TaskStatusEnum.NOT_DONE, reason);
  }

  private executeStatusChange(ids: string[], status: TaskStatusEnum, notDoneReason: string | null): void {
    if (!ids.length || this.bulkBusy()) return;

    this.bulkBusy.set(true);
    this.facade
      .updateStatusMany(ids, { status, notDoneReason })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          this.bulkBusy.set(false);
          this.selection.set([]);
          this.reportBulkResult(results, 'statusChange');
        },
        error: () => this.bulkBusy.set(false),
      });
  }

  openTransferDialog(): void {
    if (!this.selection().length) return;
    this.transferAssigneeType.set(TaskAssigneeTypeEnum.USER);
    this.transferAssigneeId.set(null);
    this.transferAssigneeDepartmentId.set(null);
    this.transferDialogVisible.set(true);
  }

  closeTransferDialog(): void {
    this.transferDialogVisible.set(false);
  }

  confirmTransfer(): void {
    const ids = this.selection().map((t) => t.id);
    if (!ids.length || !this.canConfirmTransfer() || this.bulkBusy()) return;

    const input: TaskAssigneeInput = {
      assigneeType: this.transferAssigneeType(),
      assigneeId: this.transferAssigneeType() === TaskAssigneeTypeEnum.USER ? this.transferAssigneeId() : null,
      assigneeDepartmentId:
        this.transferAssigneeType() === TaskAssigneeTypeEnum.DEPARTMENT ? this.transferAssigneeDepartmentId() : null,
    };

    this.bulkBusy.set(true);
    this.facade
      .updateAssigneeMany(ids, input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          this.bulkBusy.set(false);
          this.transferDialogVisible.set(false);
          this.selection.set([]);
          this.reportBulkResult(results, 'transfer');
        },
        error: () => this.bulkBusy.set(false),
      });
  }

  /** Toast agregado (pedido do usuário 2026-09-23) - mesmo espírito best-effort de
   *  AllMeasurementsListComponent#confirmApproveSelected: sucesso total, falha total ou parcial
   *  têm mensagens próprias, já que cada tarefa da seleção teve seu próprio resultado. */
  private reportBulkResult(results: TaskBatchResult[], kind: 'statusChange' | 'transfer' | 'templateBatch'): void {
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.length - succeeded;

    if (failed === 0) {
      this.toast.add({
        severity: 'success',
        summary: this.i18n.tUi('common.success'),
        detail: this.i18n.tUi(`tasks.bulk.${kind}Success` as never, { count: succeeded }),
      });
    } else if (succeeded === 0) {
      this.toast.add({
        severity: 'error',
        summary: this.i18n.tUi('common.error'),
        detail: this.i18n.tUi(`tasks.bulk.${kind}AllFailed` as never, { count: failed }),
      });
    } else {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi(`tasks.bulk.${kind}Partial` as never, { succeeded, failed }),
      });
    }
  }

  assigneeDisplay(row: TaskWithActionPlanModel): string {
    return taskAssigneeDisplayName(row) ?? '-';
  }

  /** Mesma regra de TasksListComponent#canEdit - status terminal (DONE/CANCELLED/NOT_DONE) não
   *  edita mais, nem REVIEW (mesmo espírito, mesma restrição de EDITABLE_STATUSES no backend). */
  canEdit(row: TaskWithActionPlanModel): boolean {
    return (
      this.policy.canManage() &&
      row.status !== TaskStatusEnum.REVIEW &&
      row.status !== TaskStatusEnum.DONE &&
      row.status !== TaskStatusEnum.CANCELLED &&
      row.status !== TaskStatusEnum.NOT_DONE
    );
  }

  /** Clique num cartão do Kanban abre a EXECUÇÃO (pedido do usuário 2026-09-23, mudou de "abre a
   *  edição" - agora é o botão de lápis, ver #onKanbanEditClick, que abre a edição). Sem gate de
   *  permissão aqui de propósito - mesmo quem não pode responder as atividades pode ABRIR pra ver
   *  em modo leitura (TaskExecutionDialogComponent#canAnswer decide isso internamente, por
   *  atividade). */
  onKanbanCardClick(row: TaskWithActionPlanModel): void {
    this.executingTask.set(row);
    this.executionDialogVisible.set(true);
  }

  /** Botão de lápis no cartão do Kanban (pedido do usuário 2026-09-23) - mesmo gate de #canEdit
   *  de antes; sem permissão/status editável, simplesmente não faz nada (mesmo espírito de o
   *  botão "Editar" nem aparecer na lista pra esses casos). */
  onKanbanEditClick(row: TaskWithActionPlanModel): void {
    if (!this.canEdit(row)) return;
    this.goEdit(row);
  }

  onExecutionDialogVisibleChange(visible: boolean): void {
    this.executionDialogVisible.set(visible);
    if (!visible) this.executingTask.set(null);
  }

  goEdit(row: TaskWithActionPlanModel): void {
    this.editingTask.set(row);
    this.upsertVisible.set(true);
  }

  /** Atalho "Minhas tarefas" - reaproveita o filtro de assignee já existente em vez de um modo à
   *  parte, então continua dentro do mesmo fluxo paginado/persistido de sempre. Alterna: clique
   *  aplica o filtro, clique de novo (com o filtro já só nesse usuário) remove (pedido do
   *  usuário 2026-09-24) - antes só aplicava, sem jeito de desfazer pelo próprio botão. */
  goMine(): void {
    const userId = this.perms.currentUserId();
    if (!userId) return;

    this.assigneeIds.set(this.isMineActive() ? null : [userId]);
    this.search();
  }

  /** Usado tanto por #goMine (decidir se alterna pra ligado ou desligado) quanto pelo template
   *  (destacar visualmente o botão quando o filtro atual é exatamente "só eu"). */
  isMineActive(): boolean {
    const userId = this.perms.currentUserId();
    const ids = this.assigneeIds();
    return !!userId && !!ids && ids.length === 1 && ids[0] === userId;
  }

  /** Regra dura (pedido do usuário 2026-09-23), mesma de TasksListComponent#isDependencySatisfied:
   *  vale pra QUALQUER usuário, TAREFA_MANAGE incluído, sem bypass nenhum. */
  isDependencySatisfied(row: TaskWithActionPlanModel): boolean {
    return !row.dependsOnTaskId || row.dependsOnTaskStatus === TaskStatusEnum.DONE;
  }

  /** REVIEW->DONE é aprovação (pedido do usuário 2026-09-23) - só quem tem TAREFA_MANAGE avança
   *  esse passo específico, mesmo sendo "dono" da tarefa (canExecuteOwn sozinho não basta aqui,
   *  diferente dos outros passos da cadeia). */
  canAdvance(row: TaskWithActionPlanModel): boolean {
    const next = nextForwardTaskStatus(row.status);
    if (next === null) return false;
    if (next === TaskStatusEnum.REVIEW && !allActivitiesAnswered(row.activities)) return false;
    if (row.status === TaskStatusEnum.REVIEW && !this.policy.canManage()) return false;
    if (!this.policy.canExecuteOwn(row)) return false;
    return this.isDependencySatisfied(row);
  }

  advanceLabel(row: TaskWithActionPlanModel): string {
    if (!this.isDependencySatisfied(row)) {
      return this.i18n.tUi('tasks.action.blockedByDependency' as never, { title: row.dependsOnTaskTitle });
    }
    const next = nextForwardTaskStatus(row.status);
    if (next === TaskStatusEnum.REVIEW && !allActivitiesAnswered(row.activities)) {
      return this.i18n.tUi('tasks.action.blockedByUnansweredActivities' as never);
    }
    return next ? this.i18n.tUi(`tasks.action.advanceTo.${next}` as never) : '';
  }

  advance(row: TaskWithActionPlanModel): void {
    const next = nextForwardTaskStatus(row.status);
    if (!next) return;

    this.facade
      .updateStatus(row.id, { status: next })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tasks.status.updated' as never),
          }),
        error: (err) =>
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: translateTasksErrorDetail(err, this.i18n) ?? this.i18n.tUi('tasks.status.updateError' as never),
          }),
      });
  }

  /** Alterna Lista/Kanban (pedido do usuário 2026-09-21) - SEMPRE recarrega os dados na troca, nos
   *  dois sentidos (pedido do usuário 2026-09-24: confiar só no <p-table [lazy]="true"> voltar a
   *  existir no DOM e disparar o onLazyLoad inicial sozinho não bastava - a lista podia ficar
   *  desatualizada em relação ao que mudou enquanto o usuário estava no Kanban, ex.: um drop que
   *  moveu uma tarefa de status). #refresh() já é "view-mode-aware" (loadKanbanData no Kanban,
   *  reloadWithCurrentState na Lista) e não depende da <p-table> estar no DOM - reloadWithCurrentState
   *  só lê lastLazyEvent/rows (estado próprio, não a referência @ViewChild) e chama loadPage. */
  setViewMode(mode: 'list' | 'kanban'): void {
    this.viewMode.set(mode);
    localStorage.setItem(STATE_KEY.NIMBUSFLOW.WORKS.ALL_TASKS.VIEW_MODE.V1, mode);
    this.selection.set([]);
    this.refresh();
  }

  private loadKanbanData(): void {
    this.facade.loadPage(
      buildListQuery<TasksAdvancedFilters>(
        { page: 0, size: AllTasksListComponent.KANBAN_PAGE_SIZE },
        this.buildAdvancedFilters(),
      ),
    );
  }

  /** Mesma regra de autorização do backend (TaskService#updateStatus): TAREFA_MANAGE muda pra
   *  qualquer status; sem ela, só o próprio assignee (TAREFA_EXECUTE) avançando um passo por vez.
   *  As regras duras abaixo (pedido do usuário 2026-09-23) valem pra QUALQUER usuário, TAREFA_
   *  MANAGE incluído, sem bypass: DONE/CANCELLED/NOT_DONE são terminais de verdade, não aceitam
   *  ser arrastadas pra NENHUM outro status (achado real 2026-09-24 - faltava esta checagem, uma
   *  tarefa Concluída conseguia ser solta em "Em revisão"/"Não fez" sem nenhum aviso claro, cada
   *  destino caindo numa regra genérica diferente ou nem sendo bloqueado no cliente); não pular
   *  etapas (REVIEW só a partir de IN_PROGRESS, DONE só a partir de REVIEW), REVIEW exige todas as
   *  atividades respondidas, dependência bloqueia progresso (IN_PROGRESS ou DONE), e reabrir
   *  IN_PROGRESS->TODO só é permitido se nenhuma atividade tiver sido respondida. REVIEW->DONE
   *  (aprovação) exige TAREFA_MANAGE mesmo sendo dono da tarefa. */
  private static readonly TERMINAL_STATUSES = new Set<TaskStatusEnum>([
    TaskStatusEnum.DONE,
    TaskStatusEnum.CANCELLED,
    TaskStatusEnum.NOT_DONE,
  ]);

  canDropTask = (task: TaskWithActionPlanModel, status: TaskStatusEnum): boolean => {
    if (task.status === status) return false;
    if (AllTasksListComponent.TERMINAL_STATUSES.has(task.status)) return false;
    if (status === TaskStatusEnum.REVIEW && task.status !== TaskStatusEnum.IN_PROGRESS) return false;
    if (status === TaskStatusEnum.REVIEW && !allActivitiesAnswered(task.activities)) return false;
    if (status === TaskStatusEnum.DONE && task.status !== TaskStatusEnum.REVIEW) return false;
    if (
      (status === TaskStatusEnum.IN_PROGRESS || status === TaskStatusEnum.DONE) &&
      !this.isDependencySatisfied(task)
    ) {
      return false;
    }
    if (
      status === TaskStatusEnum.TODO &&
      task.status === TaskStatusEnum.IN_PROGRESS &&
      task.activities.some((a) => !!a.executedAt)
    ) {
      return false;
    }

    if (this.policy.canManage()) return true;
    if (task.status === TaskStatusEnum.REVIEW) return false;
    if (!this.policy.canExecuteOwn(task)) return false;
    return nextForwardTaskStatus(task.status) === status;
  };

  /** CANCELLED/NOT_DONE passam por #requestStatusChange (pedido do usuário 2026-09-23) - mesma
   *  confirmação/justificativa do botão em lote, só que pra uma única tarefa. O card não "volta"
   *  visualmente enquanto isso: a fonte da verdade é `tasks()`, que só muda depois que a
   *  requisição de fato é confirmada e a lista recarrega. */
  onKanbanDrop(event: TaskKanbanDropEvent): void {
    if (event.status === TaskStatusEnum.CANCELLED || event.status === TaskStatusEnum.NOT_DONE) {
      this.requestStatusChange([event.task.id], event.status);
      return;
    }

    this.facade
      .updateStatus(event.task.id, { status: event.status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tasks.status.updated' as never),
          }),
        error: (err) =>
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: translateTasksErrorDetail(err, this.i18n) ?? this.i18n.tUi('tasks.status.updateError' as never),
          }),
      });
  }

  /** Drop recusado no Kanban (pedido do usuário 2026-09-23) - explica o motivo exato, na mesma
   *  ordem de prioridade das regras checadas em #canDropTask. */
  onKanbanDropRejected(event: TaskKanbanDropEvent): void {
    this.toast.add({
      severity: 'warn',
      summary: this.i18n.tUi('common.warning'),
      detail: this.kanbanDropRejectedReason(event.task, event.status),
    });
  }

  private kanbanDropRejectedReason(task: TaskWithActionPlanModel, status: TaskStatusEnum): string {
    if (AllTasksListComponent.TERMINAL_STATUSES.has(task.status)) {
      return this.i18n.tUi('tasks.action.blockedByTerminalStatus' as never, {
        status: this.i18n.tUi(`tasks.status.${task.status}` as never),
      });
    }
    if (status === TaskStatusEnum.REVIEW && task.status !== TaskStatusEnum.IN_PROGRESS) {
      return this.i18n.tUi('tasks.action.blockedBySkipSteps' as never, {
        requiredStatus: this.i18n.tUi(`tasks.status.${TaskStatusEnum.IN_PROGRESS}` as never),
        targetStatus: this.i18n.tUi(`tasks.status.${TaskStatusEnum.REVIEW}` as never),
      });
    }
    if (status === TaskStatusEnum.REVIEW && !allActivitiesAnswered(task.activities)) {
      return this.i18n.tUi('tasks.action.blockedByUnansweredActivities' as never);
    }
    if (status === TaskStatusEnum.DONE && task.status !== TaskStatusEnum.REVIEW) {
      return this.i18n.tUi('tasks.action.blockedBySkipSteps' as never, {
        requiredStatus: this.i18n.tUi(`tasks.status.${TaskStatusEnum.REVIEW}` as never),
        targetStatus: this.i18n.tUi(`tasks.status.${TaskStatusEnum.DONE}` as never),
      });
    }
    if (
      (status === TaskStatusEnum.IN_PROGRESS || status === TaskStatusEnum.DONE) &&
      !this.isDependencySatisfied(task)
    ) {
      return this.i18n.tUi('tasks.action.blockedByDependency' as never, { title: task.dependsOnTaskTitle });
    }
    if (
      status === TaskStatusEnum.TODO &&
      task.status === TaskStatusEnum.IN_PROGRESS &&
      task.activities.some((a) => !!a.executedAt)
    ) {
      return this.i18n.tUi('tasks.action.blockedByAnsweredActivities' as never);
    }
    if (task.status === TaskStatusEnum.REVIEW && status === TaskStatusEnum.DONE && !this.policy.canManage()) {
      return this.i18n.tUi('tasks.action.blockedByApprovalRequired' as never);
    }
    if (!this.policy.canManage() && !this.policy.canExecuteOwn(task)) {
      return this.i18n.tUi('tasks.action.blockedByPermission' as never);
    }
    return this.i18n.tUi('tasks.action.blockedGeneric' as never);
  }

  clear() {
    this.clearTableAndReload(this.dt);
  }

  protected formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(this.i18n.getLang(), { dateStyle: 'short' }).format(date);
  }

  protected override tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_TASKS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_TASKS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.WORKS.ALL_TASKS.FILTERS.V1;
  }

  /** Kanban-aware (pedido do usuário 2026-09-21, ver setViewMode) - nesse modo a <p-table> nem
   *  está no DOM, reloadWithCurrentState() (que depende dela) não faria nada. */
  protected override refresh(): void {
    if (this.viewMode() === 'kanban') {
      this.loadKanbanData();
      return;
    }
    this.reloadWithCurrentState();
  }

  goNew(): void {
    this.choiceDialogVisible.set(true);
  }

  onChoiceVisibleChange(visible: boolean): void {
    this.choiceDialogVisible.set(visible);
  }

  onChooseBlank(): void {
    this.templateToPrefill.set(null);
    this.editingTask.set(null);
    this.upsertVisible.set(true);
  }

  onChooseFromTemplate(): void {
    this.pickerDialogVisible.set(true);
  }

  onPickerVisibleChange(visible: boolean): void {
    this.pickerDialogVisible.set(visible);
  }

  onTemplateSelected(template: TaskTemplateModel): void {
    this.templateToPrefill.set(template);
    this.editingTask.set(null);
    this.upsertVisible.set(true);
  }

  /** Criação em lote a partir de um Modelo (pedido do usuário 2026-09-24, "Análise da água" por
   *  piscina/local x turno) - monta 1 TaskUpsertInput por combinação Local x Turno (dimensão vazia
   *  = 1 única passagem com aquele campo nulo, pra não impedir "só por local, sem turno" ou
   *  vice-versa) e dispara via TasksGlobalFacade#createMany (best-effort, mesmo padrão de
   *  "Alterar status"/"Transferir" em lote). Título de cada combinação ganha o sufixo
   *  " - {Local} - {Turno}" só nas partes que realmente variam - mesma convenção já antecipada no
   *  próprio javadoc de TaskTemplate.name (ex.: "Coral - Análise da água - Manhã"). */
  onBatchCreateRequested(request: TaskTemplateBatchRequest): void {
    const { template, locationIds, shifts, assigneeType, assigneeId, assigneeDepartmentId } = request;
    const locationNameById = new Map(this.taskLocationsFacade.options().map((o) => [o.value, o.label]));
    const locations: (string | null)[] = locationIds.length ? locationIds : [null];
    const shiftValues: (TaskShiftEnum | null)[] = shifts.length ? shifts : [null];
    const activities = template.activities.map(toActivityDraftFromConfig).map(toActivityInput);
    /** Achado real 2026-09-24 (relatado pelo usuário): sem prazo, a janela de horário do Turno
     *  (TaskService#isReleased) nunca chega a ser aplicada - ela só entra em ação no PRÓPRIO dia
     *  do vencimento. Tarefa gerada em lote é, por definição, "pra fazer agora/hoje" - prazo hoje
     *  é o default certo, não deixar em branco. */
    const todayDueDate = todayDateOnlyString();

    const inputs: TaskUpsertInput[] = [];
    for (const locationId of locations) {
      for (const shift of shiftValues) {
        const titleSuffix = [locationId ? locationNameById.get(locationId) : null, shift ? taskShiftLabel(shift, this.i18n) : null]
          .filter((part): part is string => !!part)
          .join(' - ');
        inputs.push({
          title: titleSuffix ? `${template.title} - ${titleSuffix}` : template.title,
          description: template.description,
          categoryId: template.categoryId,
          subcategoryId: template.subcategoryId,
          locationId,
          shift,
          assigneeType,
          assigneeId: assigneeType === TaskAssigneeTypeEnum.USER ? assigneeId : null,
          assigneeDepartmentId: assigneeType === TaskAssigneeTypeEnum.DEPARTMENT ? assigneeDepartmentId : null,
          dueDate: todayDueDate,
          startDate: null,
          durationDays: template.durationDays,
          recurrenceFrequency: TaskRecurrenceFrequencyEnum.NONE,
          recurrenceInterval: null,
          recurrenceWeekDays: [],
          recurrenceMonthDays: [],
          recurrenceExpiresAt: null,
          notifyAssigneeOnRecurrence: false,
          releaseTime: null,
          // true (pedido do usuário 2026-09-24) - tarefa de rotina gerada em lote (Local x Turno)
          // deve fechar sozinha em "Não fez" quando não concluída até o fim do Turno/dia (ver
          // TaskService#moveExpiredShiftTasksToNotDone/#moveOverdueTasksToNotDone no backend),
          // sem depender de alguém lembrar de marcar essa opção depois, tarefa por tarefa.
          autoMoveOverdueToNotDone: true,
          dependsOnTaskId: null,
          activities,
        });
      }
    }

    this.bulkBusy.set(true);
    this.facade.createMany(inputs).subscribe({
      next: (results) => {
        this.bulkBusy.set(false);
        this.reportBulkResult(results, 'templateBatch');
      },
      error: () => this.bulkBusy.set(false),
    });
  }

  onCreated(): void {
    this.refresh();
  }

  onUpdated(): void {
    this.refresh();
  }

  onUpsertVisibleChange(visible: boolean): void {
    this.upsertVisible.set(visible);
    if (!visible) {
      this.editingTask.set(null);
      this.templateToPrefill.set(null);
    }
  }

  protected override resetFilters(): void {
    this.title.set('');
    this.status.set(null);
    this.assigneeIds.set(null);
    this.departmentIds.set(null);
    this.locationIds.set(null);
    this.shift.set(null);
    this.createdAt.set(null);
    this.periodCreatedAt.set(null);
    this.activeStatusTab.set(TaskStatusEnum.TODO);
    this.selection.set([]);
  }

  protected override toFiltersState(): TasksFiltersState {
    return {
      title: this.title(),
      status: this.status()?.length ? this.status() : null,
      assigneeIds: this.assigneeIds()?.length ? this.assigneeIds() : null,
      departmentIds: this.departmentIds()?.length ? this.departmentIds() : null,
      locationIds: this.locationIds()?.length ? this.locationIds() : null,
      shift: this.shift()?.length ? this.shift() : null,
      actionPlanIds: null,
      createdAt: this.createdAt(),
      periodCreatedAt: this.periodCreatedAt(),
    };
  }

  protected override applyFiltersState(state: TasksFiltersState): void {
    this.title.set(state.title ?? '');
    this.status.set(state.status ?? null);
    this.assigneeIds.set(state.assigneeIds ?? null);
    this.departmentIds.set(state.departmentIds ?? null);
    this.locationIds.set(state.locationIds ?? null);
    this.shift.set(state.shift ?? null);
    this.createdAt.set(state.createdAt ?? null);
    this.periodCreatedAt.set(state.periodCreatedAt ?? null);
  }

  /** Na Lista, o status vem SEMPRE da aba ativa (pedido do usuário 2026-09-23) - um valor só,
   *  nunca o multiSelect de filtros avançados (que só é exibido/lido no Kanban, ver template). */
  protected override buildAdvancedFilters(): Partial<TasksAdvancedFilters> {
    return {
      title: this.title().trim() || undefined,
      status: this.viewMode() === 'list' ? [this.activeStatusTab()] : this.status()?.length ? this.status() : undefined,
      assigneeIds: this.assigneeIds()?.length ? this.assigneeIds() : undefined,
      departmentIds: this.departmentIds()?.length ? this.departmentIds() : undefined,
      locationIds: this.locationIds()?.length ? this.locationIds() : undefined,
      shift: this.shift()?.length ? this.shift() : undefined,
      createdAt: this.createdAt() ?? undefined,
      periodCreatedAt: this.periodCreatedAt() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: Record<string, unknown>): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const title = readSingleFilterValue(filters, 'title');
    if (title) {
      items.push({ label: this.i18n.tUi('tasks.fields.title'), value: title });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('tasks.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const createdAt = readDateRangeFilterValue(filters, 'createdAt', this.formatDate.bind(this));
    if (createdAt) {
      items.push({ label: this.i18n.tUi('tasks.fields.createdAt'), value: createdAt });
    }

    return items;
  }

  protected override loadPage(query: ReturnType<typeof buildListQuery<TasksAdvancedFilters>>): void {
    this.facade.loadPage(query);
  }

  // reload dessa lista
  // já é disparado pelo effect() de filtros da própria StatefulListPage, não precisa de
  // lógica extra aqui.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected override loadFirstPage(): void {}
}
