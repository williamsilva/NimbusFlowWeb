import { Component, DestroyRef, EventEmitter, Output, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { SelectOption } from '@models/select-option.model';
import {
  TaskCategoryOptionModel,
  TaskSubcategoryOptionModel,
  TaskTemplateModel,
} from '@models/task-templates.models';
import { TasksTemplatesApiService } from '@features/service/tasks-templates.api.service';

/** "Criar a partir de um modelo" (pedido do usuário 2026-09-24, print de referência) - cascata
 *  Categoria → Subcategoria → Modelo, reaproveitando os mesmos endpoints "/options" já filtrados
 *  por permissão do usuário atual (mesma regra de TasksCreateDialogComponent). Ao confirmar,
 *  busca o Modelo completo (com Atividades) e devolve pro pai via `templateSelected`, que abre
 *  TasksCreateDialogComponent com [prefillFromTemplate] - nenhum estado fica retido aqui. */
@Component({
  standalone: true,
  selector: 'app-task-template-picker-dialog',
  templateUrl: './task-template-picker-dialog.component.html',
  imports: [SelectModule, DialogModule, ButtonModule, FloatLabelModule, TranslateModule, ReactiveFormsModule],
})
export class TaskTemplatePickerDialogComponent {
  visible = input.required<boolean>();

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() templateSelected = new EventEmitter<TaskTemplateModel>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(TasksTemplatesApiService);

  readonly i18n = inject(I18nService);

  readonly categoryOptions = signal<TaskCategoryOptionModel[]>([]);
  readonly subcategoryOptions = signal<TaskSubcategoryOptionModel[]>([]);
  readonly templateOptions = signal<TaskTemplateModel[]>([]);

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
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
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
    this.form.reset({ categoryId: null, subcategoryId: null, templateId: null });
    this.subcategoryOptions.set([]);
    this.templateOptions.set([]);
  }

  /** Só emitido em #onHide (depois que a animação de fechar este diálogo termina de verdade) -
   *  mesmo motivo de TaskCreationChoiceDialogComponent#pendingChoice: abrir TasksCreateDialogComponent
   *  (com os p-select de Categoria/Subcategoria pré-preenchidos do modelo) na MESMA hora em que
   *  este diálogo ainda está fechando reproduzia o mesmo bug visual (seleção não refletida). */
  private pendingTemplate: TaskTemplateModel | null = null;

  close(): void {
    this.visibleChange.emit(false);
  }

  onHide(): void {
    this.close();
    const template = this.pendingTemplate;
    this.pendingTemplate = null;
    if (template) {
      this.templateSelected.emit(template);
    }
  }

  /** O Modelo completo (com Atividades) já vem na própria lista de opções (ver
   *  TaskTemplateService#listForTaskCreation no backend) - sem necessidade de uma segunda chamada
   *  só pra buscar por id. */
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

    this.pendingTemplate = template;
    this.close();
  }
}
