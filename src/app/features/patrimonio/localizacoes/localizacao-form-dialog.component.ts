import { DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Output, Component, EventEmitter } from '@angular/core';

import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

import { I18nService } from '@core/i18n/i18n.service';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { LocalizacaoModel } from '@models/localizacoes.models';
import { LocalizacoesFacade } from '@features/facade/localizacoes.facade';
import { STATUS_LOCALIZACAO_VALUES, StatusLocalizacao } from '@models/patrimonio-enums';

@Component({
  standalone: true,
  selector: 'app-localizacao-form-dialog',
  templateUrl: './localizacao-form-dialog.component.html',
  imports: [
    SelectModule,
    DialogModule,
    ButtonModule,
    TranslateModule,
    InputTextModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class LocalizacaoFormDialogComponent {
  visible = input.required<boolean>();
  editing = input<LocalizacaoModel | null>(null);

  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(LocalizacoesFacade);

  readonly i18n = inject(I18nService);
  readonly saving = signal(false);
  readonly isEditing = computed(() => !!this.editing());

  readonly statusOptions = STATUS_LOCALIZACAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`localizacoes.status.${value}` as never),
  }));

  private lastLoadedKey: string | null = null;

  readonly form = this.fb.nonNullable.group({
    descricao: ['', [Validators.required, Validators.maxLength(255)]],
    status: this.fb.nonNullable.control<StatusLocalizacao>('ATIVO', [Validators.required]),
  });

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
        descricao: current?.descricao ?? '',
        status: current?.status ?? 'ATIVO',
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
        detail: this.i18n.tUi('localizacoes.form.invalid' as never),
      });
      return;
    }

    const v = this.form.getRawValue();
    const input = { descricao: v.descricao.trim(), status: v.status };

    this.saving.set(true);
    const editingId = this.editing()?.id;
    const request$ = editingId ? this.facade.update(editingId, input) : this.facade.create(input);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi(editingId ? ('localizacoes.form.updated' as never) : ('localizacoes.form.created' as never)),
        });
        this.close();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: err?.error?.message ?? this.i18n.tUi('localizacoes.form.saveError' as never),
        });
      },
    });
  }
}
