import { computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { input, signal, Output, inject, Component, EventEmitter, effect } from '@angular/core';

import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { UsersFacade } from '@features/facade/users.facade';
import { TasksFacade } from '@features/facade/tasks.facade';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { TaskModel, TaskUpsertInput } from '@models/tasks.models';

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
    ToastModule,
    SelectModule,
    DialogModule,
    ButtonModule,
    TextareaModule,
    TranslateModule,
    InputTextModule,
    DatePickerModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class TasksCreateDialogComponent {
  visible = input.required<boolean>();
  actionPlanId = input.required<string>();
  task = input<TaskModel | null>(null);

  @Output() saved = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly tasks = inject(TasksFacade);
  readonly usersFacade = inject(UsersFacade);
  readonly assigneeOptions = this.usersFacade.options;

  readonly isEditMode = computed(() => !!this.task());
  readonly saving = signal(false);

  private lastLoadedId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: this.fb.control<string | null>(null, [Validators.maxLength(1000)]),
    assigneeId: ['', [Validators.required]],
    dueDate: this.fb.control<Date | null>(null),
  });

  constructor() {
    this.usersFacade.loadUsersOptions();

    effect(() => {
      if (!this.visible()) {
        return;
      }

      const task = this.task();

      if (!task) {
        this.lastLoadedId = null;
        this.resetFormForCreate();
        return;
      }

      if (this.lastLoadedId === task.id) {
        return;
      }

      this.lastLoadedId = task.id;

      this.form.reset({
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        dueDate: fromDateOnlyString(task.dueDate),
      });
    });
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.lastLoadedId = null;
    this.resetFormForCreate();
    this.visibleChange.emit(false);
  }

  private resetFormForCreate(): void {
    this.form.reset({ title: '', description: null, assigneeId: '', dueDate: null });
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
    const id = this.task()?.id;

    const payload: TaskUpsertInput = {
      title: v.title.trim(),
      description: v.description?.trim() || null,
      assigneeId: v.assigneeId,
      dueDate: toDateOnlyString(v.dueDate),
    };

    this.saving.set(true);

    const req$ = id ? this.tasks.update(id, payload) : this.tasks.create(this.actionPlanId(), payload);

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
