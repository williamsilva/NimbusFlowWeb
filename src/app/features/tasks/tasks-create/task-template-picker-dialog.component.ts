import { Component, DestroyRef, EventEmitter, Output, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TranslateModule } from '@ngx-translate/core';

import { MultiSelectModule } from 'primeng/multiselect';

import { I18nService } from '@core/i18n/i18n.service';
import { SelectOption } from '@models/select-option.model';
import { TASK_SHIFT_VALUES, TaskShiftEnum, taskShiftLabel } from '@models/enums/task-shift.enum';
import {
  TASK_ASSIGNEE_TYPE_VALUES,
  TaskAssigneeTypeEnum,
  taskAssigneeTypeLabel,
} from '@models/enums/task-assignee-type.enum';
import {
  TaskCategoryOptionModel,
  TaskSubcategoryOptionModel,
  TaskTemplateModel,
} from '@models/task-templates.models';
import { TasksTemplatesApiService } from '@features/service/tasks-templates.api.service';
import { TaskLocationsFacade } from '@features/facade/task-locations.facade';
import { UsersFacade } from '@features/facade/users.facade';
import { DepartmentsFacade } from '@features/facade/departments.facade';

/** Combinação Local x Turno pra gerar em lote a partir de um Modelo (pedido do usuário 2026-09-24)
 *  - uma Tarefa por combinação, mesmo padrão best-effort/N-requests-sequenciais já usado por
 *  "Alterar status"/"Transferir" em lote (ver TasksGlobalFacade). Dimensão vazia = o próprio
 *  AllTasksListComponent trata como "1 passagem com esse campo nulo" (não filtra a criação).
 *  assigneeType/assigneeId/assigneeDepartmentId são obrigatórios só em modo lote (ver #confirm) -
 *  sem modo lote, quem atribui é o próprio TasksCreateDialogComponent na revisão de sempre. */
export interface TaskTemplateBatchRequest {
  template: TaskTemplateModel;
  locationIds: string[];
  shifts: TaskShiftEnum[];
  assigneeType: TaskAssigneeTypeEnum;
  assigneeId: string | null;
  assigneeDepartmentId: string | null;
}

/** "Criar a partir de um modelo" (pedido do usuário 2026-09-24, print de referência) - cascata
 *  Categoria → Subcategoria → Modelo, reaproveitando os mesmos endpoints "/options" já filtrados
 *  por permissão do usuário atual (mesma regra de TasksCreateDialogComponent). Ao confirmar SEM
 *  marcar Local(is)/Turno(s), busca o Modelo completo (com Atividades) e devolve pro pai via
 *  `templateSelected`, que abre TasksCreateDialogComponent com [prefillFromTemplate] pra revisão -
 *  comportamento IDÊNTICO ao de antes desta seleção múltipla existir. Marcando pelo menos um Local
 *  ou Turno, emite `batchCreateRequested` no lugar (pedido do usuário 2026-09-24 - gerar várias
 *  tarefas de uma vez, uma por combinação, sem passar pela revisão individual). */
@Component({
  standalone: true,
  selector: 'app-task-template-picker-dialog',
  templateUrl: './task-template-picker-dialog.component.html',
  imports: [
    SelectModule,
    DialogModule,
    ButtonModule,
    FloatLabelModule,
    SelectButtonModule,
    TranslateModule,
    MultiSelectModule,
    ReactiveFormsModule,
  ],
})
export class TaskTemplatePickerDialogComponent {
  visible = input.required<boolean>();

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() templateSelected = new EventEmitter<TaskTemplateModel>();
  @Output() batchCreateRequested = new EventEmitter<TaskTemplateBatchRequest>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(TasksTemplatesApiService);
  private readonly taskLocationsFacade = inject(TaskLocationsFacade);
  private readonly usersFacade = inject(UsersFacade);
  private readonly departmentsFacade = inject(DepartmentsFacade);

  readonly i18n = inject(I18nService);
  readonly TaskAssigneeTypeEnum = TaskAssigneeTypeEnum;

  readonly categoryOptions = signal<TaskCategoryOptionModel[]>([]);
  readonly subcategoryOptions = signal<TaskSubcategoryOptionModel[]>([]);
  readonly templateOptions = signal<TaskTemplateModel[]>([]);
  /** Sempre opcionais (pedido do usuário 2026-09-24) - diferente de Categoria/Subcategoria/
   *  Modelo acima, que são obrigatórios pra confirmar. */
  readonly locationOptions = this.taskLocationsFacade.options;
  readonly shiftOptions = TASK_SHIFT_VALUES.map((value) => ({ value, label: taskShiftLabel(value, this.i18n) }));
  /** Responsável só faz sentido em modo lote (ver #confirm) - fora dele, quem atribui é a revisão
   *  de sempre em TasksCreateDialogComponent. */
  readonly assigneeOptions = this.usersFacade.options;
  readonly departmentOptions = this.departmentsFacade.options;
  readonly assigneeTypeOptions = TASK_ASSIGNEE_TYPE_VALUES.map((value) => ({
    value,
    label: taskAssigneeTypeLabel(value, this.i18n),
  }));

  /** p-select aqui precisa de {label, value} (mesma convenção já usada em todo o app pros
   *  seletores dinâmicos) - achado real 2026-09-24: bindar optionLabel/optionValue direto num
   *  objeto {id, name} cru fazia o valor selecionado não refletir visualmente no p-select. */
  readonly categorySelectOptions = computed<SelectOption<string>[]>(() =>
    this.categoryOptions().map((c) => ({ label: c.name, value: c.id })),
  );
  readonly subcategorySelectOptions = computed<SelectOption<string>[]>(() =>
    this.subcategoryOptions().map((s) => ({ label: s.name, value: s.id })),
  );
  readonly templateSelectOptions = computed<SelectOption<string>[]>(() =>
    this.templateOptions().map((t) => ({ label: t.name, value: t.id })),
  );

  readonly form = this.fb.nonNullable.group({
    categoryId: this.fb.control<string | null>(null),
    subcategoryId: this.fb.control<string | null>(null),
    templateId: this.fb.control<string | null>(null),
    locationIds: this.fb.nonNullable.control<string[]>([]),
    shifts: this.fb.nonNullable.control<TaskShiftEnum[]>([]),
    assigneeType: this.fb.nonNullable.control<TaskAssigneeTypeEnum>(TaskAssigneeTypeEnum.USER),
    assigneeId: this.fb.control<string | null>(null),
    assigneeDepartmentId: this.fb.control<string | null>(null),
  });

  /** Evita resetar o form de novo a cada re-execução espúria do effect() (ex.: change detection
   *  disparada por OUTRO overlay fechando - hide() do próprio p-select ao selecionar uma opção,
   *  ou onAfterLeave() de outro p-dialog - ver feedback_create_edit_dialog_effect_reset_bug_pattern
   *  na memória, mesmo bug já achado 2x antes em TasksCreateDialogComponent/
   *  TasksActivityConfigDialogComponent, faltou aplicar aqui) - achado real 2026-09-24: sem isto,
   *  o effect() reexecutava resetState() enquanto o usuário ainda escolhia Categoria/Subcategoria/
   *  Modelo, zerando a seleção que ele acabara de fazer. */
  private dialogInitialized = false;

  constructor() {
    this.taskLocationsFacade.loadOptions();
    this.usersFacade.loadUsersOptions();
    this.departmentsFacade.loadOptions();

    effect(() => {
      if (!this.visible()) {
        this.dialogInitialized = false;
        return;
      }
      if (this.dialogInitialized) return;
      this.dialogInitialized = true;
      this.resetState();
      this.api
        .categoryOptions()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (items) => this.categoryOptions.set(items),
          error: () => this.categoryOptions.set([]),
        });
    });

    this.form.controls.categoryId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((categoryId) => {
      this.form.controls.subcategoryId.setValue(null);
      this.form.controls.templateId.setValue(null);
      this.templateOptions.set([]);
      if (!categoryId) {
        this.subcategoryOptions.set([]);
        return;
      }
      this.api
        .subcategoryOptions(categoryId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (items) => this.subcategoryOptions.set(items),
          error: () => this.subcategoryOptions.set([]),
        });
    });

    this.form.controls.subcategoryId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((subcategoryId) => {
      this.form.controls.templateId.setValue(null);
      if (!subcategoryId) {
        this.templateOptions.set([]);
        return;
      }
      this.api
        .templateOptions(subcategoryId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (items) => this.templateOptions.set(items),
          error: () => this.templateOptions.set([]),
        });
    });
  }

  private resetState(): void {
    this.form.reset({
      categoryId: null,
      subcategoryId: null,
      templateId: null,
      locationIds: [],
      shifts: [],
      assigneeType: TaskAssigneeTypeEnum.USER,
      assigneeId: null,
      assigneeDepartmentId: null,
    });
    this.subcategoryOptions.set([]);
    this.templateOptions.set([]);
  }

  /** Só emitido em #onHide (depois que a animação de fechar este diálogo termina de verdade) -
   *  mesmo motivo de TaskCreationChoiceDialogComponent#pendingChoice: abrir TasksCreateDialogComponent
   *  (com os p-select de Categoria/Subcategoria pré-preenchidos do modelo) na MESMA hora em que
   *  este diálogo ainda está fechando reproduzia o mesmo bug visual (seleção não refletida). */
  private pendingTemplate: TaskTemplateModel | null = null;
  private pendingBatch: TaskTemplateBatchRequest | null = null;

  close(): void {
    this.visibleChange.emit(false);
  }

  onHide(): void {
    this.close();
    const template = this.pendingTemplate;
    this.pendingTemplate = null;
    const batch = this.pendingBatch;
    this.pendingBatch = null;
    if (batch) {
      this.batchCreateRequested.emit(batch);
    } else if (template) {
      this.templateSelected.emit(template);
    }
  }

  /** O Modelo completo (com Atividades) já vem na própria lista de opções (ver
   *  TaskTemplateService#listForTaskCreation no backend) - sem necessidade de uma segunda chamada
   *  só pra buscar por id. Sem Local/Turno marcado, comportamento idêntico a antes (1 tarefa, com
   *  revisão) - marcando pelo menos um dos dois, pula a revisão e pede a criação em lote direto
   *  (pedido do usuário 2026-09-24, ver #batchCreateRequested). */
  confirm(): void {
    const templateId = this.form.controls.templateId.value;
    const template = this.templateOptions().find((t) => t.id === templateId);
    if (!template) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('taskTemplatePicker.invalid'),
      });
      return;
    }

    const locationIds = this.form.controls.locationIds.value;
    const shifts = this.form.controls.shifts.value;
    if (locationIds.length || shifts.length) {
      const assigneeType = this.form.controls.assigneeType.value;
      const assigneeId = this.form.controls.assigneeId.value;
      const assigneeDepartmentId = this.form.controls.assigneeDepartmentId.value;
      const missingAssignee =
        assigneeType === TaskAssigneeTypeEnum.USER ? !assigneeId : !assigneeDepartmentId;
      if (missingAssignee) {
        this.toast.add({
          severity: 'warn',
          summary: this.i18n.tUi('common.warning'),
          detail: this.i18n.tUi('taskTemplatePicker.batch.missingAssignee' as never),
        });
        return;
      }
      this.pendingBatch = {
        template,
        locationIds,
        shifts,
        assigneeType,
        assigneeId: assigneeType === TaskAssigneeTypeEnum.USER ? assigneeId : null,
        assigneeDepartmentId: assigneeType === TaskAssigneeTypeEnum.DEPARTMENT ? assigneeDepartmentId : null,
      };
    } else {
      this.pendingTemplate = template;
    }
    this.close();
  }
}
