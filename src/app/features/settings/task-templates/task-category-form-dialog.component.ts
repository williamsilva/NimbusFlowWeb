import { DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Output, Component, EventEmitter } from '@angular/core';

import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

import { I18nService } from '@core/i18n/i18n.service';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { TaskCategoryModel } from '@models/task-templates.models';
import { TasksTemplatesApiService } from '@features/service/tasks-templates.api.service';

/** "+"/editar da coluna "Categorias" (pedido do usuário 2026-09-24, menu Configurações > Modelos
 *  de Tarefas) - dialog simples nome-só, mesmo padrão de DepartmentFormDialogComponent/
 *  CargoFormDialogComponent sem o campo de usuários. */
@Component({
  standalone: true,
  selector: 'app-task-category-form-dialog',
  templateUrl: './task-category-form-dialog.component.html',
  imports: [DialogModule, ButtonModule, TranslateModule, InputTextModule, FloatLabelModule, ErrorMsgComponent, ReactiveFormsModule],
})
export class TaskCategoryFormDialogComponent {
  visible = input.required<boolean>();
  editing = input.required<TaskCategoryModel | null>();

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

      this.form.reset({ name: current?.name ?? '' });
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
        detail: this.i18n.tUi('taskCategories.form.invalid'),
      });
      return;
    }

    const input = { name: this.form.getRawValue().name };

    this.saving.set(true);
    const editingId = this.editing()?.id;
    const request$ = editingId ? this.api.updateCategory(editingId, input) : this.api.createCategory(input);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi(editingId ? 'taskCategories.form.updated' : 'taskCategories.form.created'),
        });
        this.saved.emit();
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('taskCategories.form.saveError'),
        });
      },
    });
  }
}
