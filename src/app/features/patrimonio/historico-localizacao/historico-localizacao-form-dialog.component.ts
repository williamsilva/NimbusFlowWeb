import { computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { input, signal, Output, inject, Component, EventEmitter, effect } from '@angular/core';

import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { DateInputMaskDirective } from '@williamsilva/nimbus-web-commons';
import { EquipamentosFacade } from '@features/facade/equipamentos.facade';
import { LocalizacoesFacade } from '@features/facade/localizacoes.facade';
import { HistoricoLocalizacaoFacade } from '@features/facade/historico-localizacao.facade';
import { HistoricoLocalizacaoModel, HistoricoLocalizacaoUpsertInput } from '@models/historico-localizacao.models';
import { STATUS_HISTORICO_LOCALIZACAO_VALUES, StatusHistoricoLocalizacao } from '@models/patrimonio-enums';

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
  selector: 'app-historico-localizacao-form-dialog',
  templateUrl: './historico-localizacao-form-dialog.component.html',
  imports: [
    SelectModule,
    DialogModule,
    ButtonModule,
    TextareaModule,
    TranslateModule,
    DatePickerModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
    DateInputMaskDirective,
  ],
})
export class HistoricoLocalizacaoFormDialogComponent {
  visible = input.required<boolean>();
  editing = input<HistoricoLocalizacaoModel | null>(null);

  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(HistoricoLocalizacaoFacade);

  readonly i18n = inject(I18nService);
  readonly equipamentosFacade = inject(EquipamentosFacade);
  readonly equipamentoOptions = computed(() =>
    this.equipamentosFacade
      .options()
      .map((e) => ({ value: e.id, label: `${e.numeroPatrimonio} - ${e.descricao}` })),
  );
  readonly localizacoesFacade = inject(LocalizacoesFacade);
  readonly localizacaoOptions = computed(() =>
    this.localizacoesFacade.options().map((l) => ({ value: l.id, label: l.descricao })),
  );

  readonly saving = signal(false);
  readonly isEditing = computed(() => !!this.editing());

  readonly statusOptions = STATUS_HISTORICO_LOCALIZACAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`historicoLocalizacao.status.${value}` as never),
  }));

  private lastLoadedKey: string | null = null;

  readonly form = this.fb.nonNullable.group({
    equipamentoId: ['', [Validators.required]],
    localizacaoId: ['', [Validators.required]],
    status: this.fb.nonNullable.control<StatusHistoricoLocalizacao>('ATIVO', [Validators.required]),
    dataInicial: this.fb.control<Date | null>(null, [Validators.required]),
    dataFinal: this.fb.control<Date | null>(null),
    observacao: ['', [Validators.maxLength(200)]],
  });

  constructor() {
    this.equipamentosFacade.loadOptions();
    this.localizacoesFacade.loadOptions();

    effect(() => {
      if (!this.visible()) {
        this.lastLoadedKey = null;
        return;
      }

      this.equipamentosFacade.loadOptions(true);
      this.localizacoesFacade.loadOptions(true);

      const current = this.editing();
      const key = current?.id ?? 'CREATE';
      if (this.lastLoadedKey === key) return;
      this.lastLoadedKey = key;

      this.form.reset({
        equipamentoId: current?.equipamento.id ?? '',
        localizacaoId: current?.localizacao.id ?? '',
        status: current?.status ?? 'ATIVO',
        dataInicial: fromDateOnlyString(current?.dataInicial),
        dataFinal: fromDateOnlyString(current?.dataFinal),
        observacao: current?.observacao ?? '',
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
        detail: this.i18n.tUi('historicoLocalizacao.form.invalid' as never),
      });
      return;
    }

    const v = this.form.getRawValue();
    const payload: HistoricoLocalizacaoUpsertInput = {
      equipamentoId: v.equipamentoId,
      localizacaoId: v.localizacaoId,
      status: v.status,
      dataInicial: toDateOnlyString(v.dataInicial)!,
      dataFinal: toDateOnlyString(v.dataFinal),
      observacao: v.observacao.trim() || null,
    };

    this.saving.set(true);
    const editingId = this.editing()?.id;
    const request$ = editingId ? this.facade.update(editingId, payload) : this.facade.create(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi(
            editingId ? ('historicoLocalizacao.form.updated' as never) : ('historicoLocalizacao.form.created' as never),
          ),
        });
        this.close();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: err?.error?.message ?? this.i18n.tUi('historicoLocalizacao.form.saveError' as never),
        });
      },
    });
  }
}
