import { computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { input, signal, Output, inject, Component, EventEmitter, effect } from '@angular/core';

import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { UsersFacade } from '@features/facade/users.facade';
import { TasksFacade } from '@features/facade/tasks.facade';
import { TasksGlobalFacade } from '@features/facade/tasks-global.facade';
import { DepartmentsFacade } from '@features/facade/departments.facade';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { DateInputMaskDirective } from '@williamsilva/nimbus-web-commons';
import { TaskModel, TaskUpsertInput } from '@models/tasks.models';
import {
  TASK_ASSIGNEE_TYPE_VALUES,
  TaskAssigneeTypeEnum,
  taskAssigneeTypeLabel,
} from '@models/enums/task-assignee-type.enum';
import {
  TASK_RECURRENCE_FREQUENCY_VALUES,
  TaskRecurrenceFrequencyEnum,
  taskRecurrenceFrequencyLabel,
} from '@models/enums/task-recurrence-frequency.enum';

function toDateOnlyString(value: Date | null): string | null {
  if (!value) return null;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromDateOnlyString(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

@Component({
  standalone: true,
  selector: 'app-tasks-create-dialog',
  templateUrl: './tasks-create-dialog.component.html',
  imports: [
    CsDatePipe,
    ToastModule,
    SelectModule,
    DialogModule,
    ButtonModule,
    CheckboxModule,
    TextareaModule,
    TranslateModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    FloatLabelModule,
    SelectButtonModule,
    ErrorMsgComponent,
    DateInputMaskDirective,
    ReactiveFormsModule,
  ],
})
export class TasksCreateDialogComponent {
  visible = input.required<boolean>();
  /** Opcional (pedido do usuário 2026-09-21 - tarefa avulsa, sem Plano de Ação): ausente quando
   *  este diálogo é aberto pela lista geral de Tarefas (AllTasksListComponent), presente quando
   *  aberto de dentro de um plano específico (TasksListComponent). Ver `save()`. */
  actionPlanId = input<string | null>(null);
  task = input<TaskModel | null>(null);

  @Output() saved = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly departmentsFacade = inject(DepartmentsFacade);

  readonly i18n = inject(I18nService);
  readonly tasks = inject(TasksFacade);
  readonly globalTasks = inject(TasksGlobalFacade);
  readonly usersFacade = inject(UsersFacade);
  readonly assigneeOptions = this.usersFacade.options;
  readonly departmentOptions = this.departmentsFacade.options;

  readonly isEditMode = computed(() => !!this.task());
  readonly saving = signal(false);

  readonly assigneeTypeOptions = TASK_ASSIGNEE_TYPE_VALUES.map((value) => ({
    value,
    label: taskAssigneeTypeLabel(value, this.i18n),
  }));

  readonly recurrenceFrequencyOptions = TASK_RECURRENCE_FREQUENCY_VALUES.map((value) => ({
    value,
    label: taskRecurrenceFrequencyLabel(value, this.i18n),
  }));

  readonly TaskAssigneeTypeEnum = TaskAssigneeTypeEnum;
  readonly TaskRecurrenceFrequencyEnum = TaskRecurrenceFrequencyEnum;

  /** Opções de dependência: dentro de um plano (actionPlanId presente), outras tarefas do MESMO
   *  plano (já carregadas por TasksListComponent, ver TasksFacade.items); sem plano (tarefa
   *  avulsa), só outras tarefas TAMBÉM avulsas (mesma regra do backend, ver
   *  TaskService#resolveDependency - Objects.equals dos dois actionPlanId nulos). Exclui a
   *  própria tarefa em modo edição (não pode depender de si mesma). */
  readonly dependencyOptions = computed(() => {
    const currentId = this.task()?.id;
    const source = this.actionPlanId()
      ? this.tasks.items()
      : this.globalTasks.tasks().filter((t) => t.actionPlanId == null);

    return source.filter((t) => t.id !== currentId).map((t) => ({ label: t.title, value: t.id }));
  });

  private lastLoadedId: string | null = null;
  /** Evita resetar o form de novo em modo criação a cada re-execução do effect() (ver
   *  constructor) - true assim que o form já foi inicializado pra este "open" do diálogo. */
  private createFormInitialized = false;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: this.fb.control<string | null>(null, [Validators.maxLength(1000)]),
    assigneeType: this.fb.nonNullable.control<TaskAssigneeTypeEnum>(TaskAssigneeTypeEnum.USER, [Validators.required]),
    assigneeId: this.fb.control<string | null>(null, [Validators.required]),
    assigneeDepartmentId: this.fb.control<string | null>(null),
    startDate: this.fb.control<Date | null>(null, [Validators.required]),
    durationDays: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    recurrenceFrequency: this.fb.nonNullable.control<TaskRecurrenceFrequencyEnum>(
      TaskRecurrenceFrequencyEnum.NONE,
      [Validators.required],
    ),
    notifyAssigneeOnRecurrence: this.fb.nonNullable.control<boolean>(false),
    dependsOnTaskId: this.fb.control<string | null>(null),
  });

  /** Prévia do cronograma (pedido do usuário 2026-09-22, referência visual de um sistema antigo) -
   *  getters simples, não signal/computed: lidos diretamente no template, que já reavalia a cada
   *  ciclo de detecção de mudanças disparado pelos próprios eventos do formulário (input/change),
   *  sem precisar de valueChanges->toSignal aqui. */
  get scheduleStartDate(): Date | null {
    return this.form.controls.startDate.value;
  }

  get scheduleDurationDays(): number | null {
    return this.form.controls.durationDays.value;
  }

  get scheduleDueDate(): Date | null {
    const start = this.scheduleStartDate;
    const days = this.scheduleDurationDays;
    if (!start || !days || days <= 0) return null;

    const due = new Date(start);
    due.setDate(due.getDate() + days);
    return due;
  }

  get hasSchedulePreview(): boolean {
    return !!this.scheduleStartDate && !!this.scheduleDurationDays && this.scheduleDurationDays > 0;
  }

  constructor() {
    this.usersFacade.loadUsersOptions();
    this.departmentsFacade.loadOptions();

    // Só um dos dois (assigneeId/assigneeDepartmentId) é obrigatório por vez, de acordo com o
    // toggle - o outro é limpo e perde a validação, pra não bloquear o save com um campo escondido
    // e vazio (mesma obrigatoriedade cruzada validada de novo no backend, ver TaskRequest).
    this.form.controls.assigneeType.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((assigneeType) => {
      this.applyAssigneeValidators(assigneeType);
    });

    effect(() => {
      if (!this.visible()) {
        this.createFormInitialized = false;
        return;
      }

      const task = this.task();

      if (!task) {
        // Sem isto, qualquer re-execução espúria do effect() (ex.: change detection disparada
        // pelo fechamento do painel de um p-select após selecionar uma opção) chamaria
        // resetFormForCreate() de novo e apagaria o que o usuário já tinha preenchido.
        if (this.createFormInitialized) {
          return;
        }
        this.createFormInitialized = true;
        this.lastLoadedId = null;
        this.resetFormForCreate();
        return;
      }

      this.createFormInitialized = false;
      if (this.lastLoadedId === task.id) {
        return;
      }

      this.lastLoadedId = task.id;

      this.form.reset({
        title: task.title,
        description: task.description,
        assigneeType: task.assigneeType,
        assigneeId: task.assigneeId,
        assigneeDepartmentId: task.assigneeDepartmentId,
        startDate: fromDateOnlyString(task.startDate),
        durationDays: task.durationDays,
        recurrenceFrequency: task.recurrenceFrequency,
        notifyAssigneeOnRecurrence: false,
        dependsOnTaskId: task.dependsOnTaskId,
      });
      this.applyAssigneeValidators(task.assigneeType);
    });
  }

  private applyAssigneeValidators(assigneeType: TaskAssigneeTypeEnum): void {
    if (assigneeType === TaskAssigneeTypeEnum.USER) {
      this.form.controls.assigneeDepartmentId.setValue(null);
      this.form.controls.assigneeDepartmentId.clearValidators();
      this.form.controls.assigneeId.setValidators([Validators.required]);
    } else {
      this.form.controls.assigneeId.setValue(null);
      this.form.controls.assigneeId.clearValidators();
      this.form.controls.assigneeDepartmentId.setValidators([Validators.required]);
    }
    this.form.controls.assigneeId.updateValueAndValidity();
    this.form.controls.assigneeDepartmentId.updateValueAndValidity();
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.lastLoadedId = null;
    this.createFormInitialized = false;
    this.resetFormForCreate();
    this.visibleChange.emit(false);
  }

  private resetFormForCreate(): void {
    this.form.reset({
      title: '',
      description: null,
      assigneeType: TaskAssigneeTypeEnum.USER,
      assigneeId: null,
      assigneeDepartmentId: null,
      startDate: null,
      durationDays: null,
      recurrenceFrequency: TaskRecurrenceFrequencyEnum.NONE,
      notifyAssigneeOnRecurrence: false,
      dependsOnTaskId: null,
    });
    this.applyAssigneeValidators(TaskAssigneeTypeEnum.USER);
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('tasks.form.invalid'),
      });
      return;
    }

    const v = this.form.getRawValue();
    const task = this.task();
    const id = task?.id;

    const payload: TaskUpsertInput = {
      title: v.title.trim(),
      description: v.description?.trim() || null,
      assigneeType: v.assigneeType,
      assigneeId: v.assigneeType === TaskAssigneeTypeEnum.USER ? v.assigneeId : null,
      assigneeDepartmentId: v.assigneeType === TaskAssigneeTypeEnum.DEPARTMENT ? v.assigneeDepartmentId : null,
      // Preservado tal como já estava quando o usuário não mexe em Data de início/Dias para
      // executar (ex.: edição de uma tarefa antiga, ou de uma ocorrência gerada por recorrência) -
      // o servidor só recalcula o prazo quando os dois campos abaixo vêm preenchidos juntos, ver
      // TaskService#computeDueDate.
      dueDate: task?.dueDate ?? null,
      startDate: toDateOnlyString(v.startDate),
      durationDays: v.durationDays,
      recurrenceFrequency: v.recurrenceFrequency,
      notifyAssigneeOnRecurrence: v.notifyAssigneeOnRecurrence,
      dependsOnTaskId: v.dependsOnTaskId,
    };

    this.saving.set(true);

    const actionPlanId = this.actionPlanId();
    const req$ = id
      ? this.tasks.update(id, payload)
      : actionPlanId
        ? this.tasks.create(actionPlanId, payload)
        : this.globalTasks.create(payload);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);

        const isEdit = !!id;

        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: isEdit
            ? this.i18n.tUi('tasks.form.updated')
            : this.i18n.tUi('tasks.form.created'),
        });

        if (isEdit) {
          this.updated.emit();
        } else {
          this.created.emit();
        }

        this.saved.emit();
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('tasks.form.saveError'),
        });
      },
    });
  }
}
