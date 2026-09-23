import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TranslateModule } from '@ngx-translate/core';
import { Component, EventEmitter, Output, ViewChild, computed, inject, input, signal } from '@angular/core';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { SignaturePadComponent } from '@features/tasks/tasks-execution/signature-pad.component';
import {
  TaskActivityDataTypeEnum,
  taskActivityDataTypeLabel,
} from '@models/enums/task-activity-data-type.enum';
import { TaskActivityCriticalConditionEnum } from '@models/enums/task-activity-critical-condition.enum';
import { TaskActivityAnswerInput, TaskActivityModel } from '@models/task-activities.models';

function toDateOnlyString(value: Date | null): string | null {
  if (!value) return null;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Card de UMA atividade na tela de execução (pedido do usuário 2026-09-23) - por trás de um
 * `@if (activity().executedAt)`: já respondida vira leitura (valor + justificativa/observação +
 * "Data da execução"); ainda não respondida vira o formulário editável do tipo certo + botão
 * "Salvar" (que só grava ESSA atividade, ver TaskExecutionDialogComponent#onActivitySaved).
 *
 * Campos fora de um form reativo de propósito (mesmo espírito de TasksActivityConfigDialogComponent
 * com as opções) - só UM campo por vez é relevante (o do dataCollectionType da atividade), um
 * FormGroup com 10 controles pra usar só 1 seria ceremônia sem ganho.
 */
@Component({
  standalone: true,
  selector: 'app-task-activity-execution-card',
  templateUrl: './task-activity-execution-card.component.html',
  styleUrl: './task-activity-execution-card.component.scss',
  imports: [
    FormsModule,
    CsDatePipe,
    ButtonModule,
    SelectModule,
    CheckboxModule,
    TextareaModule,
    TranslateModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    FloatLabelModule,
    ToggleSwitchModule,
    SignaturePadComponent,
  ],
})
export class TaskActivityExecutionCardComponent {
  activity = input.required<TaskActivityModel>();
  /** false quando a Tarefa está num status terminal ou o usuário não tem permissão de execução
   *  (ver TaskExecutionDialogComponent#canAnswer) - trava tudo, mesmo já tendo sido respondida. */
  canAnswer = input(true);
  saving = input(false);

  @Output() readonly answered = new EventEmitter<{ input: TaskActivityAnswerInput; file: File | null }>();

  /** Só existe de verdade quando dataCollectionType=SIGNATURE (dentro do @switch do template) -
   *  @ViewChild (não uma variável de template `#signaturePad`) porque um `@case` cria seu próprio
   *  escopo de view, invisível pro botão "Salvar" comum a todos os tipos fora do @switch. */
  @ViewChild(SignaturePadComponent) private signaturePadRef?: SignaturePadComponent;

  readonly i18n = inject(I18nService);
  readonly TaskActivityDataTypeEnum = TaskActivityDataTypeEnum;

  readonly answerText = signal('');
  readonly answerDate = signal<Date | null>(null);
  readonly answerNumber = signal<number | null>(null);
  readonly answerOptionId = signal<string | null>(null);
  readonly answerOptionIds = signal<string[]>([]);
  readonly observationReported = signal(false);
  readonly observationText = signal('');
  readonly justification = signal('');
  readonly file = signal<File | null>(null);
  readonly signatureHasContent = signal(false);

  readonly singleChoiceOptions = computed(() =>
    this.activity().options.map((o) => ({ value: o.id, label: o.label })),
  );

  /** Template Angular não aceita arrow function em interpolação - por isso estes lookups viram
   *  métodos aqui, não `.find(o => ...)` direto no .html. */
  selectedSingleChoiceLabel(): string {
    const option = this.activity().options.find((o) => o.id === this.activity().answerOptionId);
    return option?.label ?? '';
  }

  selectedMultipleChoiceLabels(): string {
    const selectedIds = this.activity().answerOptionIds;
    return this.activity().options
        .filter((o) => selectedIds.includes(o.id))
        .map((o) => o.label)
        .join(', ');
  }

  taskActivityDataTypeLabel(): string {
    return taskActivityDataTypeLabel(this.activity().dataCollectionType, this.i18n);
  }

  /** Mesma lógica de TaskService#applyAnswer no backend (duplicada de propósito - aqui é só pra
   *  decidir se MOSTRA a caixa de justificativa antes de salvar; a validação de verdade é sempre
   *  do backend). */
  readonly isCriticalAnswer = computed(() => {
    const a = this.activity();
    switch (a.dataCollectionType) {
      case TaskActivityDataTypeEnum.DATE: {
        const date = this.answerDate();
        if (!date) return false;
        const value = toDateOnlyString(date);
        return (!!a.dateCriticalMin && !!value && value < a.dateCriticalMin)
            || (!!a.dateCriticalMax && !!value && value > a.dateCriticalMax);
      }
      case TaskActivityDataTypeEnum.NUMBER: {
        const value = this.answerNumber();
        if (value == null) return false;
        return (a.numberCriticalMin != null && value < a.numberCriticalMin)
            || (a.numberCriticalMax != null && value > a.numberCriticalMax);
      }
      case TaskActivityDataTypeEnum.LINEAR_SCALE: {
        const value = this.answerNumber();
        if (value == null) return false;
        return (a.scaleCriticalMinValue != null && value < a.scaleCriticalMinValue)
            || (a.scaleCriticalMaxValue != null && value > a.scaleCriticalMaxValue);
      }
      case TaskActivityDataTypeEnum.SINGLE_CHOICE: {
        const optionId = this.answerOptionId();
        return !!a.options.find((o) => o.id === optionId)?.critical;
      }
      case TaskActivityDataTypeEnum.MULTIPLE_CHOICE: {
        const criticalIds = a.options.filter((o) => o.critical).map((o) => o.id);
        if (!criticalIds.length || !a.multipleChoiceCriticalCondition) return false;
        const selected = this.answerOptionIds();
        const anySelected = criticalIds.some((id) => selected.includes(id));
        return a.multipleChoiceCriticalCondition === TaskActivityCriticalConditionEnum.SELECTED
          ? anySelected
          : !criticalIds.every((id) => selected.includes(id));
      }
      default:
        return false;
    }
  });

  readonly canSave = computed(() => {
    if (this.saving()) return false;
    const a = this.activity();
    switch (a.dataCollectionType) {
      case TaskActivityDataTypeEnum.TEXT:
        return this.answerText().trim().length > 0;
      case TaskActivityDataTypeEnum.DATE:
        return this.answerDate() != null;
      case TaskActivityDataTypeEnum.NUMBER:
      case TaskActivityDataTypeEnum.LINEAR_SCALE:
        return this.answerNumber() != null;
      case TaskActivityDataTypeEnum.SINGLE_CHOICE:
        return this.answerOptionId() != null;
      case TaskActivityDataTypeEnum.MULTIPLE_CHOICE:
        return this.answerOptionIds().length > 0;
      case TaskActivityDataTypeEnum.SIGNATURE:
        return this.signatureHasContent();
      case TaskActivityDataTypeEnum.DOCUMENT:
      case TaskActivityDataTypeEnum.IMAGE:
        return this.file() != null;
      default:
        return false;
    }
  });

  toggleMultipleChoiceOption(optionId: string): void {
    this.answerOptionIds.update((ids) =>
      ids.includes(optionId) ? ids.filter((id) => id !== optionId) : [...ids, optionId],
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file.set(input.files?.[0] ?? null);
  }

  onSignatureChanged(hasContent: boolean): void {
    this.signatureHasContent.set(hasContent);
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;
    const a = this.activity();

    let file: File | null = null;
    if (a.dataCollectionType === TaskActivityDataTypeEnum.SIGNATURE && this.signaturePadRef) {
      file = await this.signaturePadRef.toFile();
    } else if (a.dataCollectionType === TaskActivityDataTypeEnum.DOCUMENT || a.dataCollectionType === TaskActivityDataTypeEnum.IMAGE) {
      file = this.file();
    }

    const input: TaskActivityAnswerInput = {
      answerText: a.dataCollectionType === TaskActivityDataTypeEnum.TEXT ? this.answerText().trim() : null,
      answerDate: a.dataCollectionType === TaskActivityDataTypeEnum.DATE ? toDateOnlyString(this.answerDate()) : null,
      answerNumber:
        a.dataCollectionType === TaskActivityDataTypeEnum.NUMBER || a.dataCollectionType === TaskActivityDataTypeEnum.LINEAR_SCALE
          ? this.answerNumber()
          : null,
      answerOptionId: a.dataCollectionType === TaskActivityDataTypeEnum.SINGLE_CHOICE ? this.answerOptionId() : null,
      answerOptionIds: a.dataCollectionType === TaskActivityDataTypeEnum.MULTIPLE_CHOICE ? this.answerOptionIds() : null,
      justification: this.isCriticalAnswer() ? this.justification().trim() : null,
      observationReported: this.observationReported(),
      observationText: this.observationReported() ? this.observationText().trim() : null,
    };

    this.answered.emit({ input, file });
  }

  reset(): void {
    this.answerText.set('');
    this.answerDate.set(null);
    this.answerNumber.set(null);
    this.answerOptionId.set(null);
    this.answerOptionIds.set([]);
    this.observationReported.set(false);
    this.observationText.set('');
    this.justification.set('');
    this.file.set(null);
    this.signatureHasContent.set(false);
  }
}
