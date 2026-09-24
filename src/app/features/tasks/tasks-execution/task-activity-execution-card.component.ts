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
import { Component, EventEmitter, Output, ViewChild, computed, effect, inject, input, signal } from '@angular/core';

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

/** Inverso de toDateOnlyString - usado só ao reabrir uma atividade DATE já respondida pra editar
 *  (pedido do usuário 2026-09-23). Monta a partir dos componentes ano/mês/dia em vez de
 *  `new Date(value)` de propósito - este último interpreta "YYYY-MM-DD" como UTC meia-noite, que
 *  em fusos negativos (Brasil) volta um dia ao converter pra local. */
function parseDateOnlyString(value: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
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
  /** true só com a Tarefa IN_PROGRESS (ver TaskExecutionDialogComponent#canEditAnswered) - libera
   *  o botão "Editar" na leitura de uma atividade JÁ respondida (pedido do usuário 2026-09-23). */
  canEditAnswered = input(false);
  saving = input(false);

  @Output() readonly answered = new EventEmitter<{ input: TaskActivityAnswerInput; file: File | null }>();

  /** Só existe de verdade quando dataCollectionType=SIGNATURE (dentro do @switch do template) -
   *  @ViewChild (não uma variável de template `#signaturePad`) porque um `@case` cria seu próprio
   *  escopo de view, invisível pro botão "Salvar" comum a todos os tipos fora do @switch. */
  @ViewChild(SignaturePadComponent) private signaturePadRef?: SignaturePadComponent;

  readonly i18n = inject(I18nService);
  readonly TaskActivityDataTypeEnum = TaskActivityDataTypeEnum;

  /** Card vem minimizado por padrão (pedido do usuário 2026-09-23, muitas atividades numa
   *  lista só - deixava a rolagem enorme) - só o cabeçalho aparece até o usuário clicar. */
  readonly expanded = signal(false);

  toggleExpanded(): void {
    this.expanded.update((value) => !value);
  }

  /** true = reabriu uma atividade JÁ respondida pra editar de novo (pedido do usuário 2026-09-23,
   *  só possível com canEditAnswered()) - troca a leitura pelo mesmo formulário editável de
   *  primeira resposta, pré-preenchido com o valor salvo. */
  readonly editing = signal(false);

  constructor() {
    /** activity() só troca de referência de verdade após um "Salvar" bem-sucedido (o pai substitui
     *  só o item afetado no array, ver TaskExecutionDialogComponent#onAnswered) - volta pra leitura
     *  sozinho quando isso acontece. Roda também na primeira renderização (editing já começa
     *  false, inofensivo). */
    effect(() => {
      this.activity();
      this.editing.set(false);
    });
  }

  readonly answerText = signal('');
  readonly answerDate = signal<Date | null>(null);
  readonly answerNumber = signal<number | null>(null);
  readonly answerOptionId = signal<string | null>(null);
  readonly answerOptionIds = signal<string[]>([]);
  readonly observationReported = signal(false);
  readonly observationText = signal('');
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

  /** Mesma exigência de TaskService#answerActivity no backend (duplicada de propósito, só pra
   *  desabilitar o botão "Salvar" antes de bater no servidor - achado real 2026-09-23: sem isso
   *  o botão ficava clicável mesmo com a caixa de observação vazia, e o usuário só descobria pelo
   *  erro 400 genérico "Não foi possível salvar a atividade"). Resposta crítica NÃO exige mais
   *  nada além disso - virou só um aviso visual (isCriticalAnswer()), redundante com "Relatar não
   *  conformidade ou observação" (pedido do usuário 2026-09-23). */
  readonly canSave = computed(() => {
    if (this.saving()) return false;
    if (this.observationReported() && this.observationText().trim().length === 0) return false;
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
    this.file.set(null);
    this.signatureHasContent.set(false);
  }

  /** Reabre uma atividade JÁ respondida pra editar de novo (pedido do usuário 2026-09-23, só
   *  chamado quando canEditAnswered() é true) - pré-preenche os signals com o valor salvo, mesmo
   *  formulário editável de primeira resposta a partir daqui. SIGNATURE/DOCUMENT/IMAGE não dá pra
   *  pré-preencher (é um arquivo) - precisa fornecer um novo antes de conseguir salvar de novo. */
  startEdit(): void {
    const a = this.activity();
    this.answerText.set(a.answerText ?? '');
    this.answerDate.set(parseDateOnlyString(a.answerDate));
    this.answerNumber.set(a.answerNumber);
    this.answerOptionId.set(a.answerOptionId);
    this.answerOptionIds.set(a.answerOptionIds ?? []);
    this.observationReported.set(a.observationReported);
    this.observationText.set(a.observationText ?? '');
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.reset();
    this.editing.set(false);
  }
}
