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
import { TaskLocationModel } from '@models/task-locations.models';
import { TaskLocationsFacade } from '@features/facade/task-locations.facade';

@Component({
  standalone: true,
  selector: 'app-task-location-form-dialog',
  templateUrl: './task-location-form-dialog.component.html',
  imports: [
    DialogModule,
    ButtonModule,
    TranslateModule,
    InputTextModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class TaskLocationFormDialogComponent {
  visible = input.required<boolean>();
  editing = input.required<TaskLocationModel | null>();

  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(TaskLocationsFacade);

  readonly i18n = inject(I18nService);
  readonly saving = signal(false);

  readonly isEditing = computed(() => this.editing() != null);

  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>('', [Validators.required, Validators.maxLength(120)]),
  });

  /** id do local cujos dados já estão carregados no form, ou 'CREATE' quando é um form de criação
   *  já inicializado - mesmo padrão de CargoFormDialogComponent (evita que um re-fire espúrio
   *  deste effect() chame form.reset() de novo e apague o que o usuário já preencheu). */
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
        detail: this.i18n.tUi('taskLocations.form.invalid'),
      });
      return;
    }

    const v = this.form.getRawValue();
    const input = { name: v.name };

    this.saving.set(true);
    const editingId = this.editing()?.id;
    const request$ = editingId ? this.facade.update(editingId, input) : this.facade.create(input);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi(editingId ? 'taskLocations.form.updated' : 'taskLocations.form.created'),
        });
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('taskLocations.form.saveError'),
        });
      },
    });
  }
}
