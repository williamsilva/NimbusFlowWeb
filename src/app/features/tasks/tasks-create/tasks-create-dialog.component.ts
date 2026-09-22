import { computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
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
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
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
import { TaskRecurrenceFrequencyEnum } from '@models/enums/task-recurrence-frequency.enum';
import { DAY_OF_WEEK_VALUES, DayOfWeekEnum, dayOfWeekLabel } from '@models/enums/day-of-week.enum';

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

function toTimeOnlyString(value: Date | null): string | null {
  if (!value) return null;
  const h = String(value.getHours()).padStart(2, '0');
  const m = String(value.getMinutes()).padStart(2, '0');
  return `${h}:${m}:00`;
}

function fromTimeOnlyString(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [h, m] = value.split(':').map(Number);
  if (h == null || m == null || Number.isNaN(h) || Number.isNaN(m)) return null;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date;
}

function nonEmptyArray(control: AbstractControl): ValidationErrors | null {
  const value = control.value as unknown[] | null;
  return value && value.length > 0 ? null : { required: true };
}

/** Opção do dropdown "Frequência" (pedido do usuário 2026-09-23, referência visual de um sistema
 *  antigo) - puramente do frontend, não existe no backend. "Todos os dias"/"A cada X dias" mapeiam
 *  pro MESMO TaskRecurrenceFrequencyEnum.DAILY (só variando recurrenceInterval); os demais valores
 *  são 1:1 com o enum do backend - ver #toBackendFrequency/#toFormOption. */
type RecurrenceFormOption =
  | 'NONE'
  | 'DAILY_EVERY'
  | 'DAILY_INTERVAL'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'YEARLY'
  | 'WEEKLY_DAYS'
  | 'MONTHLY_DAYS';

const INTERVAL_OPTIONS: RecurrenceFormOption[] = ['DAILY_INTERVAL', 'WEEKLY', 'MONTHLY', 'YEARLY'];

@Component({
  standalone: true,
  selector: 'app-tasks-create-dialog',
  templateUrl: './tasks-create-dialog.component.html',
  styleUrl: './tasks-create-dialog.component.scss',
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
    MultiSelectModule,
    ToggleSwitchModule,
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

  readonly recurrenceOptions: { value: RecurrenceFormOption; label: string }[] = (
    ['NONE', 'DAILY_EVERY', 'DAILY_INTERVAL', 'WEEKLY', 'MONTHLY', 'YEARLY', 'WEEKLY_DAYS', 'MONTHLY_DAYS'] as const
  ).map((value) => ({ value, label: this.i18n.tUi(`tasks.recurrenceOption.${value}` as never) }));

  readonly dayOfWeekOptions = DAY_OF_WEEK_VALUES.map((value) => ({ value, label: dayOfWeekLabel(value, this.i18n) }));

  readonly monthDayOptions = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));

  readonly TaskAssigneeTypeEnum = TaskAssigneeTypeEnum;

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
    recurrenceOption: this.fb.nonNullable.control<RecurrenceFormOption>('NONE', [Validators.required]),
    recurrenceInterval: this.fb.control<number | null>(null),
    recurrenceWeekDays: this.fb.nonNullable.control<DayOfWeekEnum[]>([]),
    recurrenceMonthDays: this.fb.nonNullable.control<number[]>([]),
    neverExpires: this.fb.nonNullable.control<boolean>(true),
    recurrenceExpiresAt: this.fb.control<Date | null>(null),
    notifyAssigneeOnRecurrence: this.fb.nonNullable.control<boolean>(false),
    releaseTimeEnabled: this.fb.nonNullable.control<boolean>(false),
    releaseTime: this.fb.control<Date | null>(null),
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

    this.form.controls.recurrenceOption.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((option) => {
      this.applyRecurrenceValidators(option);
    });

    this.form.controls.neverExpires.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((neverExpires) => {
      this.applyExpirationState(neverExpires);
    });

    this.form.controls.releaseTimeEnabled.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((enabled) => {
      this.applyReleaseTimeState(enabled);
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

      const recurrenceOption = this.toFormOption(task.recurrenceFrequency, task.recurrenceInterval);
      const neverExpires = !task.recurrenceExpiresAt;
      const releaseTimeEnabled = !!task.releaseTime;

      this.form.reset({
        title: task.title,
        description: task.description,
        assigneeType: task.assigneeType,
        assigneeId: task.assigneeId,
        assigneeDepartmentId: task.assigneeDepartmentId,
        startDate: fromDateOnlyString(task.startDate),
        durationDays: task.durationDays,
        recurrenceOption,
        recurrenceInterval: task.recurrenceInterval,
        recurrenceWeekDays: task.recurrenceWeekDays ?? [],
        recurrenceMonthDays: task.recurrenceMonthDays ?? [],
        neverExpires,
        recurrenceExpiresAt: fromDateOnlyString(task.recurrenceExpiresAt),
        notifyAssigneeOnRecurrence: task.notifyAssigneeOnRecurrence,
        releaseTimeEnabled,
        releaseTime: fromTimeOnlyString(task.releaseTime),
        dependsOnTaskId: task.dependsOnTaskId,
      });
      this.applyAssigneeValidators(task.assigneeType);
      this.applyRecurrenceValidators(recurrenceOption);
      this.applyExpirationState(neverExpires);
      this.applyReleaseTimeState(releaseTimeEnabled);
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

  /** Cada opção de Frequência exige um campo diferente (Intervalo/Dias da semana/Dias do mês) -
   *  mesma disciplina de #applyAssigneeValidators: valida só o que se aplica, limpa o resto. */
  private applyRecurrenceValidators(option: RecurrenceFormOption): void {
    const interval = this.form.controls.recurrenceInterval;
    const weekDays = this.form.controls.recurrenceWeekDays;
    const monthDays = this.form.controls.recurrenceMonthDays;

    interval.clearValidators();
    weekDays.clearValidators();
    monthDays.clearValidators();

    if (option === 'DAILY_EVERY') {
      interval.setValue(1);
    } else if (INTERVAL_OPTIONS.includes(option)) {
      interval.setValidators([Validators.required, Validators.min(1)]);
      if (!interval.value || interval.value < 1) {
        interval.setValue(2);
      }
    } else if (option === 'WEEKLY_DAYS') {
      weekDays.setValidators([nonEmptyArray]);
    } else if (option === 'MONTHLY_DAYS') {
      monthDays.setValidators([nonEmptyArray]);
    }

    interval.updateValueAndValidity();
    weekDays.updateValueAndValidity();
    monthDays.updateValueAndValidity();
  }

  private applyExpirationState(neverExpires: boolean): void {
    if (neverExpires) {
      this.form.controls.recurrenceExpiresAt.setValue(null);
      this.form.controls.recurrenceExpiresAt.disable();
    } else {
      this.form.controls.recurrenceExpiresAt.enable();
    }
  }

  private applyReleaseTimeState(enabled: boolean): void {
    if (enabled) {
      this.form.controls.releaseTime.enable();
    } else {
      this.form.controls.releaseTime.setValue(null);
      this.form.controls.releaseTime.disable();
    }
  }

  /** "Todos os dias" (interval fixo 1) e "A cada X dias" (interval editável) mapeiam pro MESMO
   *  TaskRecurrenceFrequencyEnum.DAILY - reconstrói qual dos dois mostrar no dropdown a partir do
   *  interval salvo (edição de uma tarefa existente). */
  private toFormOption(frequency: TaskRecurrenceFrequencyEnum, interval: number | null): RecurrenceFormOption {
    if (frequency === TaskRecurrenceFrequencyEnum.DAILY) {
      return interval == null || interval <= 1 ? 'DAILY_EVERY' : 'DAILY_INTERVAL';
    }
    return frequency as unknown as RecurrenceFormOption;
  }

  private toBackendFrequency(option: RecurrenceFormOption): TaskRecurrenceFrequencyEnum {
    if (option === 'DAILY_EVERY' || option === 'DAILY_INTERVAL') {
      return TaskRecurrenceFrequencyEnum.DAILY;
    }
    return option as unknown as TaskRecurrenceFrequencyEnum;
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
      recurrenceOption: 'NONE',
      recurrenceInterval: null,
      recurrenceWeekDays: [],
      recurrenceMonthDays: [],
      neverExpires: true,
      recurrenceExpiresAt: null,
      notifyAssigneeOnRecurrence: false,
      releaseTimeEnabled: false,
      releaseTime: null,
      dependsOnTaskId: null,
    });
    this.applyAssigneeValidators(TaskAssigneeTypeEnum.USER);
    this.applyRecurrenceValidators('NONE');
    this.applyExpirationState(true);
    this.applyReleaseTimeState(false);
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
    const recurrenceFrequency = this.toBackendFrequency(v.recurrenceOption);

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
      recurrenceFrequency,
      recurrenceInterval: recurrenceFrequency === TaskRecurrenceFrequencyEnum.NONE ? null : v.recurrenceInterval,
      recurrenceWeekDays: recurrenceFrequency === TaskRecurrenceFrequencyEnum.WEEKLY_DAYS ? v.recurrenceWeekDays : [],
      recurrenceMonthDays:
        recurrenceFrequency === TaskRecurrenceFrequencyEnum.MONTHLY_DAYS ? v.recurrenceMonthDays : [],
      recurrenceExpiresAt: v.neverExpires ? null : toDateOnlyString(v.recurrenceExpiresAt),
      notifyAssigneeOnRecurrence: v.notifyAssigneeOnRecurrence,
      releaseTime: v.releaseTimeEnabled ? toTimeOnlyString(v.releaseTime) : null,
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
