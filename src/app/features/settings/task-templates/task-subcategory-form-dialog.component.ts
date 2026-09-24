import { DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Output, Component, EventEmitter } from '@angular/core';

import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

import { I18nService } from '@core/i18n/i18n.service';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { TaskCategoryModel, TaskSubcategoryModel } from '@models/task-templates.models';
import { TasksTemplatesApiService } from '@features/service/tasks-templates.api.service';

/** "+"/editar da coluna "Subcategorias" (pedido do usuário 2026-09-24) - categoryId é um p-select
 *  próprio (não implícito pela seleção da tela) pra o form funcionar sozinho independentemente do
 *  que estiver selecionado na coluna 1 no momento; defaultCategoryId pré-seleciona a Categoria em
 *  destaque na tela ao abrir em modo criação. */
@Component({
  standalone: true,
  selector: 'app-task-subcategory-form-dialog',
  templateUrl: './task-subcategory-form-dialog.component.html',
  imports: [
    DialogModule,
    ButtonModule,
    SelectModule,
    TranslateModule,
    InputTextModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class TaskSubcategoryFormDialogComponent {
  visible = input.required<boolean>();
  editing = input.required<TaskSubcategoryModel | null>();
  categoryOptions = input.required<TaskCategoryModel[]>();
  defaultCategoryId = input<string | null>(null);

  @Output() saved = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(TasksTemplatesApiService);

  readonly i18n = inject(I18nService);
  readonly saving = signal(false);

  readonly isEditing = computed(() => this.editing() != null);

  readonly form = this.fb.nonNullable.group({
    categoryId: this.fb.control<string | null>(null, [Validators.required]),
    name: this.fb.nonNullable.control<string>('', [Validators.required, Validators.maxLength(120)]),
  });

  private lastLoadedKey: string | null = null;

  constructor() {
    effect(() => {
      if (!this.visible()) {
        this.lastLoadedKey = null;
        return;
      }

      const current = this.editing();
      const key = current?.id ?? 'CREATE';
      if (this.lastLoadedKey === key) return;
      this.lastLoadedKey = key;

      this.form.reset({
        categoryId: current?.categoryId ?? this.defaultCategoryId(),
        name: current?.name ?? '',
      });
    });
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.visibleChange.emit(false);
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('taskSubcategories.form.invalid'),
      });
      return;
    }

    const v = this.form.getRawValue();
    const input = { categoryId: v.categoryId as string, name: v.name };

    this.saving.set(true);
    const editingId = this.editing()?.id;
    const request$ = editingId ? this.api.updateSubcategory(editingId, input) : this.api.createSubcategory(input);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi(editingId ? 'taskSubcategories.form.updated' : 'taskSubcategories.form.created'),
        });
        this.saved.emit();
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('taskSubcategories.form.saveError'),
        });
      },
    });
  }
}
