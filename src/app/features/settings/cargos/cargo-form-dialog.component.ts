import { DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Output, Component, EventEmitter } from '@angular/core';

import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { FloatLabelModule } from 'primeng/floatlabel';

import { I18nService } from '@core/i18n/i18n.service';
import { UserOptionModel } from '@models/groups.models';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { CargoModel } from '@models/cargos.models';
import { CargosFacade } from '@features/facade/cargos.facade';

@Component({
  standalone: true,
  selector: 'app-cargo-form-dialog',
  templateUrl: './cargo-form-dialog.component.html',
  imports: [
    DialogModule,
    ButtonModule,
    TranslateModule,
    InputTextModule,
    FloatLabelModule,
    MultiSelectModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class CargoFormDialogComponent {
  visible = input.required<boolean>();
  editing = input.required<CargoModel | null>();
  userOptions = input.required<UserOptionModel[]>();

  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(CargosFacade);

  readonly i18n = inject(I18nService);
  readonly saving = signal(false);

  readonly isEditing = computed(() => this.editing() != null);

  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>('', [Validators.required, Validators.maxLength(120)]),
    userIds: this.fb.nonNullable.control<string[]>([], [Validators.required]),
  });

  /** id do cargo cujos dados já estão carregados no form, ou 'CREATE' quando é um form de criação
   *  já inicializado - mesmo bugfix de DepartmentFormDialogComponent (evita que um re-fire
   *  espúrio deste effect() chame form.reset() de novo e apague o que o usuário já preencheu). */
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
        name: current?.name ?? '',
        userIds: current?.userIds ?? [],
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
        detail: this.i18n.tUi('cargos.form.invalid'),
      });
      return;
    }

    const v = this.form.getRawValue();
    const input = { name: v.name, userIds: v.userIds };

    this.saving.set(true);
    const editingId = this.editing()?.id;
    const request$ = editingId ? this.facade.update(editingId, input) : this.facade.create(input);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi(editingId ? 'cargos.form.updated' : 'cargos.form.created'),
        });
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('cargos.form.saveError'),
        });
      },
    });
  }
}
