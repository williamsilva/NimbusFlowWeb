import { DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Output, Component, EventEmitter } from '@angular/core';

import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { SelectOption } from '@models/select-option.model';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import {
  taskActivityDataTypeIcon,
  taskActivityDataTypeLabel,
} from '@models/enums/task-activity-data-type.enum';
import { TaskActivityConfigModel, TaskActivityDraft, toActivityDraftFromConfig, toActivityInput } from '@models/task-activities.models';
import { TaskCategoryModel, TaskSubcategoryModel, TaskTemplateModel } from '@models/task-templates.models';
import { TasksTemplatesApiService } from '@features/service/tasks-templates.api.service';
import { TasksActivityConfigDialogComponent } from '@features/tasks/tasks-create/tasks-activity-config-dialog.component';

/** "+"/editar da coluna "Modelos de Tarefas" (pedido do usuário 2026-09-24) - categoryId/
 *  subcategoryId são uma cascata própria do dialog (mesmo espírito de
 *  TaskSubcategoryFormDialogComponent), categoryId é só um filtro de UI (o payload real só manda
 *  subcategoryId, ver TaskTemplateInput). Sem responsável padrão de propósito (decisão do usuário
 *  2026-09-24 - ver TaskTemplateModel). */
@Component({
  standalone: true,
  selector: 'app-task-template-form-dialog',
  templateUrl: './task-template-form-dialog.component.html',
  styleUrl: './task-template-form-dialog.component.scss',
  imports: [
    SelectModule,
    DialogModule,
    ButtonModule,
    TextareaModule,
    TranslateModule,
    InputTextModule,
    InputNumberModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
    TasksActivityConfigDialogComponent,
  ],
})
export class TaskTemplateFormDialogComponent {
  visible = input.required<boolean>();
  editing = input.required<TaskTemplateModel | null>();
  categoryOptions = input.required<TaskCategoryModel[]>();
  defaultCategoryId = input<string | null>(null);
  defaultSubcategoryId = input<string | null>(null);

  @Output() saved = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(TasksTemplatesApiService);

  readonly i18n = inject(I18nService);
  readonly saving = signal(false);

  readonly isEditing = computed(() => this.editing() != null);

  readonly subcategoryOptions = signal<TaskSubcategoryModel[]>([]);

  /** p-select aqui precisa de {label, value} (mesma convenção já usada em todo o app pros
   *  seletores dinâmicos) - achado real 2026-09-24: bindar optionLabel/optionValue direto num
   *  objeto {id, name} cru fazia o valor selecionado não refletir visualmente no p-select. */
  readonly categorySelectOptions = computed<SelectOption<string>[]>(() =>
    this.categoryOptions().map((c) => ({ label: c.name, value: c.id })),
  );
  readonly subcategorySelectOptions = computed<SelectOption<string>[]>(() =>
    this.subcategoryOptions().map((s) => ({ label: s.name, value: s.id })),
  );

  readonly activities = signal<TaskActivityDraft[]>([]);
  readonly editingActivity = signal<TaskActivityDraft | null>(null);
  readonly activityDialogVisible = signal(false);
  private draggingActivityIndex: number | null = null;

  readonly taskActivityDataTypeLabel = (type: TaskActivityConfigModel['dataCollectionType']) =>
    taskActivityDataTypeLabel(type, this.i18n);
  readonly taskActivityDataTypeIconOf = (type: TaskActivityConfigModel['dataCollectionType']) =>
    taskActivityDataTypeIcon(type);

  readonly form = this.fb.nonNullable.group({
    categoryId: this.fb.control<string | null>(null, [Validators.required]),
    subcategoryId: this.fb.control<string | null>(null, [Validators.required]),
    name: this.fb.nonNullable.control<string>('', [Validators.required, Validators.maxLength(120)]),
    title: this.fb.nonNullable.control<string>('', [Validators.required, Validators.maxLength(200)]),
    description: this.fb.control<string | null>(null, [Validators.maxLength(1000)]),
    durationDays: this.fb.control<number | null>(null),
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

      const categoryId = current?.categoryId ?? this.defaultCategoryId();
      this.form.reset({
        categoryId,
        subcategoryId: current?.subcategoryId ?? this.defaultSubcategoryId(),
        name: current?.name ?? '',
        title: current?.title ?? '',
        description: current?.description ?? null,
        durationDays: current?.durationDays ?? null,
      });
      this.activities.set((current?.activities ?? []).map(toActivityDraftFromConfig));
      this.loadSubcategoryOptions(categoryId);
    });

    this.form.controls.categoryId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((categoryId) => {
      this.form.controls.subcategoryId.setValue(null);
      this.loadSubcategoryOptions(categoryId);
    });
  }

  private loadSubcategoryOptions(categoryId: string | null): void {
    if (!categoryId) {
      this.subcategoryOptions.set([]);
      return;
    }
    this.api
      .listSubcategories(categoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => this.subcategoryOptions.set(items),
        error: () => this.subcategoryOptions.set([]),
      });
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.activities.set([]);
    this.visibleChange.emit(false);
  }

  openAddActivity(): void {
    this.editingActivity.set(null);
    this.activityDialogVisible.set(true);
  }

  openEditActivity(draft: TaskActivityDraft): void {
    this.editingActivity.set(draft);
    this.activityDialogVisible.set(true);
  }

  onActivityDialogVisibleChange(visible: boolean): void {
    this.activityDialogVisible.set(visible);
    if (!visible) this.editingActivity.set(null);
  }

  onActivitySaved(draft: TaskActivityDraft): void {
    this.activities.update((activities) => {
      const index = activities.findIndex((a) => a.clientId === draft.clientId);
      if (index === -1) return [...activities, draft];
      const next = [...activities];
      next[index] = draft;
      return next;
    });
    this.editingActivity.set(null);
  }

  removeActivity(clientId: string): void {
    this.activities.update((activities) => activities.filter((a) => a.clientId !== clientId));
  }

  onActivityDragStart(index: number): void {
    this.draggingActivityIndex = index;
  }

  onActivityDrop(targetIndex: number): void {
    const sourceIndex = this.draggingActivityIndex;
    this.draggingActivityIndex = null;
    if (sourceIndex === null || sourceIndex === targetIndex) return;

    this.activities.update((activities) => {
      const next = [...activities];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('taskTemplates.form.invalid'),
      });
      return;
    }

    const v = this.form.getRawValue();
    const input = {
      subcategoryId: v.subcategoryId as string,
      name: v.name,
      title: v.title,
      description: v.description,
      durationDays: v.durationDays,
      activities: this.activities().map(toActivityInput),
    };

    this.saving.set(true);
    const editingId = this.editing()?.id;
    const request$ = editingId ? this.api.updateTemplate(editingId, input) : this.api.createTemplate(input);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi(editingId ? 'taskTemplates.form.updated' : 'taskTemplates.form.created'),
        });
        this.saved.emit();
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('taskTemplates.form.saveError'),
        });
      },
    });
  }
}
