import { computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { input, signal, Output, inject, Component, EventEmitter, effect } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { DateInputMaskDirective } from '@williamsilva/nimbus-web-commons';
import {
  TaskActivityDataTypeEnum,
  TASK_ACTIVITY_DATA_TYPE_VALUES,
  taskActivityDataTypeLabel,
} from '@models/enums/task-activity-data-type.enum';
import {
  TaskActivityCriticalConditionEnum,
  TASK_ACTIVITY_CRITICAL_CONDITION_VALUES,
  taskActivityCriticalConditionLabel,
} from '@models/enums/task-activity-critical-condition.enum';
import { TaskActivityDraft, TaskActivityOptionModel } from '@models/task-activities.models';

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

const CHOICE_TYPES = [TaskActivityDataTypeEnum.SINGLE_CHOICE, TaskActivityDataTypeEnum.MULTIPLE_CHOICE];

/**
 * "Configuração da atividade" (pedido do usuário 2026-09-23, referência visual de um sistema
 * antigo de checklist/inspeção) - sub-diálogo de UMA atividade, aberto pelo "+ Adicionar"/editar
 * de TasksCreateDialogComponent#activities. Nunca salva sozinho no backend - só devolve o
 * TaskActivityDraft pro pai via `saved`, que entra na lista em memória até a Tarefa inteira ser
 * salva (ver TaskActivityDraft, ponto único de "identidade" antes de existir id de verdade).
 *
 * Description/instructions são texto plano (não rico/HTML) de propósito - simplificação
 * deliberada em relação ao print de referência (que mostra uma barra B/I/U/link): o backend já
 * trata esses dois campos como VARCHAR simples (mesmo padrão de Task.description), então um editor
 * rico exigiria sanitização de HTML e um novo componente sem necessidade funcional pedida.
 */
@Component({
  standalone: true,
  selector: 'app-tasks-activity-config-dialog',
  templateUrl: './tasks-activity-config-dialog.component.html',
  styleUrl: './tasks-activity-config-dialog.component.scss',
  imports: [
    FormsModule,
    ToastModule,
    SelectModule,
    SliderModule,
    DialogModule,
    ButtonModule,
    TooltipModule,
    CheckboxModule,
    TextareaModule,
    TranslateModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    FloatLabelModule,
    RadioButtonModule,
    ErrorMsgComponent,
    DateInputMaskDirective,
    ReactiveFormsModule,
  ],
})
export class TasksActivityConfigDialogComponent {
  visible = input.required<boolean>();
  /** Nulo = adicionando uma atividade nova; preenchido = editando uma já existente na lista (ver
   *  TasksCreateDialogComponent#openEditActivity). */
  activity = input<TaskActivityDraft | null>(null);

  @Output() saved = new EventEmitter<TaskActivityDraft>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly TaskActivityDataTypeEnum = TaskActivityDataTypeEnum;
  readonly TaskActivityCriticalConditionEnum = TaskActivityCriticalConditionEnum;

  readonly dataTypeOptions = TASK_ACTIVITY_DATA_TYPE_VALUES.map((value) => ({
    value,
    label: taskActivityDataTypeLabel(value, this.i18n),
  }));

  readonly criticalConditionOptions = TASK_ACTIVITY_CRITICAL_CONDITION_VALUES.map((value) => ({
    value,
    label: taskActivityCriticalConditionLabel(value, this.i18n),
  }));

  /** Opções de SINGLE_CHOICE/MULTIPLE_CHOICE (pedido do usuário 2026-09-23) - fora do form
   *  reativo de propósito, é uma lista dinâmica com sua própria adição/remoção/reordenação, mesmo
   *  espírito de TasksCreateDialogComponent#activities em relação ao form principal. */
  readonly options = signal<TaskActivityOptionModel[]>([]);
  /** Só usados pelo editor de MULTIPLE_CHOICE (pedido do usuário 2026-09-23, "Resposta para a
   *  atividade" + checkbox "crítica" ANTES de clicar "+", ver print) - texto/estado do próximo
   *  item a entrar na lista, não uma opção já adicionada. */
  readonly newOptionLabel = signal('');
  readonly newOptionCritical = signal(false);
  private draggingOptionIndex: number | null = null;

  readonly form = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(300)]],
    dataCollectionType: this.fb.control<TaskActivityDataTypeEnum | null>(null, [Validators.required]),
    instructions: this.fb.control<string | null>(null, [Validators.maxLength(1000)]),
    scaleMinValue: this.fb.control<number | null>(0),
    scaleMaxValue: this.fb.control<number | null>(10),
    scaleMinLabel: this.fb.control<string | null>(null),
    scaleMaxLabel: this.fb.control<string | null>(null),
    scaleCriticalMinValue: this.fb.control<number | null>(null),
    scaleCriticalMaxValue: this.fb.control<number | null>(null),
    dateCriticalMin: this.fb.control<Date | null>(null),
    dateCriticalMax: this.fb.control<Date | null>(null),
    numberCriticalMin: this.fb.control<number | null>(null),
    numberCriticalMax: this.fb.control<number | null>(null),
    multipleChoiceCriticalCondition: this.fb.control<TaskActivityCriticalConditionEnum | null>(null),
  });

  readonly isChoiceType = computed(() => {
    const type = this.form.controls.dataCollectionType.value;
    return type != null && CHOICE_TYPES.includes(type);
  });

  private lastLoadedClientId: string | null = null;
  /** Evita resetar o form de novo em modo criação a cada re-execução espúria do effect() (ex.:
   *  change detection disparada pelo p-select de "Tipo de coleta de dados" ao selecionar uma
   *  opção) - mesmo bug/fix já usado em TasksCreateDialogComponent#createFormInitialized (achado
   *  2x antes disso, ver feedback_create_edit_dialog_effect_reset_bug_pattern). Sem isto, trocar o
   *  tipo de coleta apagava a descrição inteira que o usuário já tinha digitado. */
  private createFormInitialized = false;

  constructor() {
    effect(() => {
      if (!this.visible()) {
        this.createFormInitialized = false;
        return;
      }

      const activity = this.activity();

      if (!activity) {
        if (this.createFormInitialized) {
          return;
        }
        this.createFormInitialized = true;
        this.lastLoadedClientId = null;

        this.form.reset({
          description: '',
          dataCollectionType: null,
          instructions: null,
          scaleMinValue: 0,
          scaleMaxValue: 10,
          scaleMinLabel: null,
          scaleMaxLabel: null,
          scaleCriticalMinValue: null,
          scaleCriticalMaxValue: null,
          dateCriticalMin: null,
          dateCriticalMax: null,
          numberCriticalMin: null,
          numberCriticalMax: null,
          multipleChoiceCriticalCondition: null,
        });
        this.options.set([]);
        this.newOptionLabel.set('');
        this.newOptionCritical.set(false);
        return;
      }

      this.createFormInitialized = false;
      if (this.lastLoadedClientId === activity.clientId) {
        return;
      }
      this.lastLoadedClientId = activity.clientId;

      this.form.reset({
        description: activity.description,
        dataCollectionType: activity.dataCollectionType,
        instructions: activity.instructions,
        scaleMinValue: activity.scaleMinValue,
        scaleMaxValue: activity.scaleMaxValue,
        scaleMinLabel: activity.scaleMinLabel,
        scaleMaxLabel: activity.scaleMaxLabel,
        scaleCriticalMinValue: activity.scaleCriticalMinValue,
        scaleCriticalMaxValue: activity.scaleCriticalMaxValue,
        dateCriticalMin: fromDateOnlyString(activity.dateCriticalMin),
        dateCriticalMax: fromDateOnlyString(activity.dateCriticalMax),
        numberCriticalMin: activity.numberCriticalMin,
        numberCriticalMax: activity.numberCriticalMax,
        multipleChoiceCriticalCondition: activity.multipleChoiceCriticalCondition,
      });
      this.options.set([...activity.options]);
      this.newOptionLabel.set('');
      this.newOptionCritical.set(false);
    });

    this.form.controls.dataCollectionType.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      // Trocar de tipo esvazia as opções (pedido implícito - opções de um tipo não fazem sentido
      // pro outro, mesma disciplina de TaskService#saveActivities zerando campos irrelevantes).
      this.options.set([]);
      this.newOptionLabel.set('');
      this.newOptionCritical.set(false);
    });
  }

  close(): void {
    this.lastLoadedClientId = null;
    this.visibleChange.emit(false);
  }

  onHide(): void {
    this.close();
  }

  /** Só SINGLE_CHOICE (pedido do usuário 2026-09-23) - linha inline editável, ver print. */
  addOption(): void {
    this.options.update((options) => [
      ...options,
      {
        id: crypto.randomUUID(),
        label: '',
        critical: false,
        requiresPhoto: false,
        requiresDocument: false,
        requiresJustification: false,
      },
    ]);
  }

  updateOption(index: number, patch: Partial<TaskActivityOptionModel>): void {
    this.options.update((options) => options.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  removeOption(index: number): void {
    this.options.update((options) => options.filter((_, i) => i !== index));
  }

  /** Só MULTIPLE_CHOICE (pedido do usuário 2026-09-23) - "Resposta para a atividade" + checkbox +
   *  "+" adicionam UM item de cada vez à lista, diferente da tabela sempre-editável de
   *  SINGLE_CHOICE (ver print). */
  addMultipleChoiceOption(): void {
    const label = this.newOptionLabel().trim();
    if (!label) return;

    this.options.update((options) => [
      ...options,
      {
        id: crypto.randomUUID(),
        label,
        critical: this.newOptionCritical(),
        requiresPhoto: false,
        requiresDocument: false,
        requiresJustification: false,
      },
    ]);
    this.newOptionLabel.set('');
    this.newOptionCritical.set(false);
  }

  /** "Editar" (ícone lápis, ver print) - remove da lista e devolve os valores pro input de cima,
   *  pra reentrada (mesma UX de "Editar Tags" já usada noutras telas). */
  editMultipleChoiceOption(index: number): void {
    const option = this.options()[index];
    if (!option) return;
    this.newOptionLabel.set(option.label);
    this.newOptionCritical.set(option.critical);
    this.removeOption(index);
  }

  onOptionDragStart(index: number): void {
    this.draggingOptionIndex = index;
  }

  onOptionDrop(targetIndex: number): void {
    const sourceIndex = this.draggingOptionIndex;
    this.draggingOptionIndex = null;
    if (sourceIndex === null || sourceIndex === targetIndex) return;

    this.options.update((options) => {
      const next = [...options];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    const type = this.form.controls.dataCollectionType.value;

    if (this.form.controls.description.invalid || !type) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('tasks.activityConfig.invalid' as never),
      });
      return;
    }

    const v = this.form.getRawValue();

    if (type === TaskActivityDataTypeEnum.LINEAR_SCALE) {
      const min = v.scaleMinValue;
      const max = v.scaleMaxValue;
      if (min == null || max == null || !v.scaleMinLabel?.trim() || !v.scaleMaxLabel?.trim() || min >= max) {
        this.toast.add({
          severity: 'warn',
          summary: this.i18n.tUi('common.warning'),
          detail: this.i18n.tUi('tasks.activityConfig.invalidLinearScale' as never),
        });
        return;
      }
    }

    if (this.isChoiceType() && this.options().some((o) => !o.label.trim())) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('tasks.activityConfig.invalidOptionLabel' as never),
      });
      return;
    }

    if ((type === TaskActivityDataTypeEnum.SINGLE_CHOICE || type === TaskActivityDataTypeEnum.MULTIPLE_CHOICE)
        && this.options().length === 0) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('tasks.activityConfig.invalidNoOptions' as never),
      });
      return;
    }

    if (type === TaskActivityDataTypeEnum.MULTIPLE_CHOICE
        && this.options().some((o) => o.critical)
        && !v.multipleChoiceCriticalCondition) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('tasks.activityConfig.invalidCriticalCondition' as never),
      });
      return;
    }

    const isLinearScale = type === TaskActivityDataTypeEnum.LINEAR_SCALE;
    const isDate = type === TaskActivityDataTypeEnum.DATE;
    const isNumber = type === TaskActivityDataTypeEnum.NUMBER;
    const isMultipleChoice = type === TaskActivityDataTypeEnum.MULTIPLE_CHOICE;
    const isSingleChoice = type === TaskActivityDataTypeEnum.SINGLE_CHOICE;

    const existing = this.activity();
    const draft: TaskActivityDraft = {
      id: existing?.id ?? null,
      clientId: existing?.clientId ?? crypto.randomUUID(),
      position: existing?.position ?? 0,
      description: v.description.trim(),
      dataCollectionType: type,
      instructions: v.instructions?.trim() || null,
      scaleMinValue: isLinearScale ? v.scaleMinValue : null,
      scaleMaxValue: isLinearScale ? v.scaleMaxValue : null,
      scaleMinLabel: isLinearScale ? v.scaleMinLabel : null,
      scaleMaxLabel: isLinearScale ? v.scaleMaxLabel : null,
      scaleCriticalMinValue: isLinearScale ? v.scaleCriticalMinValue : null,
      scaleCriticalMaxValue: isLinearScale ? v.scaleCriticalMaxValue : null,
      dateCriticalMin: isDate ? toDateOnlyString(v.dateCriticalMin) : null,
      dateCriticalMax: isDate ? toDateOnlyString(v.dateCriticalMax) : null,
      numberCriticalMin: isNumber ? v.numberCriticalMin : null,
      numberCriticalMax: isNumber ? v.numberCriticalMax : null,
      multipleChoiceCriticalCondition: isMultipleChoice ? v.multipleChoiceCriticalCondition : null,
      // Campos de resposta/execução (pedido do usuário 2026-09-23) - este diálogo é só de
      // CONFIGURAÇÃO, nunca os altera; preserva o que já veio (na prática sempre vazio, já que a
      // lista trava assim que qualquer atividade é respondida - ver saveActivities no backend).
      answerText: existing?.answerText ?? null,
      answerDate: existing?.answerDate ?? null,
      answerNumber: existing?.answerNumber ?? null,
      answerOptionId: existing?.answerOptionId ?? null,
      answerOptionIds: existing?.answerOptionIds ?? [],
      answerSignatureUrl: existing?.answerSignatureUrl ?? null,
      answerDocumentUrl: existing?.answerDocumentUrl ?? null,
      answerImageUrl: existing?.answerImageUrl ?? null,
      critical: existing?.critical ?? false,
      observationReported: existing?.observationReported ?? false,
      observationText: existing?.observationText ?? null,
      executedAt: existing?.executedAt ?? null,
      executedById: existing?.executedById ?? null,
      executedByName: existing?.executedByName ?? null,
      options: (isSingleChoice || isMultipleChoice)
        ? this.options().map((o) => ({
            ...o,
            requiresPhoto: isSingleChoice && o.requiresPhoto,
            requiresDocument: isSingleChoice && o.requiresDocument,
            requiresJustification: isSingleChoice && o.requiresJustification,
          }))
        : [],
    };

    this.saved.emit(draft);
    this.close();
  }
}
