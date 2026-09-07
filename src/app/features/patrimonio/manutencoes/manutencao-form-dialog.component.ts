import { computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { input, signal, Output, inject, Component, EventEmitter, effect } from '@angular/core';

import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { DateInputMaskDirective } from '@williamsilva/nimbus-web-commons';
import { EquipamentosFacade } from '@features/facade/equipamentos.facade';
import { ManutencoesFacade } from '@features/facade/manutencoes.facade';
import { ManutencaoModel, ManutencaoUpsertInput } from '@models/manutencoes.models';
import {
  STATUS_MANUTENCAO_VALUES,
  StatusManutencao,
  TIPO_MANUTENCAO_VALUES,
  TipoManutencao,
} from '@models/patrimonio-enums';

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
  selector: 'app-manutencao-form-dialog',
  templateUrl: './manutencao-form-dialog.component.html',
  imports: [
    SelectModule,
    DialogModule,
    ButtonModule,
    TextareaModule,
    InputTextModule,
    TranslateModule,
    DatePickerModule,
    InputNumberModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
    DateInputMaskDirective,
  ],
})
export class ManutencaoFormDialogComponent {
  visible = input.required<boolean>();
  editing = input<ManutencaoModel | null>(null);

  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(ManutencoesFacade);

  readonly i18n = inject(I18nService);
  readonly equipamentosFacade = inject(EquipamentosFacade);
  readonly equipamentoOptions = computed(() =>
    this.equipamentosFacade
      .options()
      .map((e) => ({ value: e.id, label: `${e.numeroPatrimonio} - ${e.descricao}` })),
  );

  readonly saving = signal(false);
  readonly isEditMode = computed(() => !!this.editing());

  readonly statusOptions = STATUS_MANUTENCAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`manutencoes.status.${value}` as never),
  }));

  readonly tipoOptions = TIPO_MANUTENCAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`manutencoes.tipo.${value}` as never),
  }));

  private lastLoadedId: string | null = null;
  private createFormInitialized = false;

  readonly form = this.fb.nonNullable.group({
    equipamentoId: ['', [Validators.required]],
    autorizadaNome: ['', [Validators.required, Validators.maxLength(200)]],
    status: this.fb.nonNullable.control<StatusManutencao>('ORCANDO', [Validators.required]),
    tipoManutencao: this.fb.control<TipoManutencao | null>(null, [Validators.required]),
    preco: this.fb.control<number | null>(null),
    dataEnvio: this.fb.control<Date | null>(new Date(), [Validators.required]),
    dataRetorno: this.fb.control<Date | null>(null),
    inicioGarantia: this.fb.control<Date | null>(null),
    fimGarantia: this.fb.control<Date | null>(null),
    descricao: ['', [Validators.required, Validators.maxLength(255)]],
    observacao: ['', [Validators.maxLength(200)]],
  });

  constructor() {
    this.equipamentosFacade.loadOptions();

    effect(() => {
      if (!this.visible()) {
        this.createFormInitialized = false;
        return;
      }

      this.equipamentosFacade.loadOptions(true);

      const editing = this.editing();

      if (!editing) {
        if (this.createFormInitialized) return;
        this.createFormInitialized = true;
        this.lastLoadedId = null;
        this.resetFormForCreate();
        return;
      }

      this.createFormInitialized = false;
      if (this.lastLoadedId === editing.id) return;

      this.lastLoadedId = editing.id;
      this.form.reset({
        equipamentoId: editing.equipamento.id,
        autorizadaNome: editing.autorizadaNome,
        status: editing.status,
        tipoManutencao: editing.tipoManutencao,
        preco: editing.preco,
        dataEnvio: fromDateOnlyString(editing.dataEnvio),
        dataRetorno: fromDateOnlyString(editing.dataRetorno),
        inicioGarantia: fromDateOnlyString(editing.inicioGarantia),
        fimGarantia: fromDateOnlyString(editing.fimGarantia),
        descricao: editing.descricao,
        observacao: editing.observacao ?? '',
      });
    });
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.lastLoadedId = null;
    this.createFormInitialized = false;
    this.resetFormForCreate();
    this.visibleChange.emit(false);
  }

  private resetFormForCreate(): void {
    this.form.reset({
      equipamentoId: '',
      autorizadaNome: '',
      status: 'ORCANDO',
      tipoManutencao: null,
      preco: null,
      dataEnvio: new Date(),
      dataRetorno: null,
      inicioGarantia: null,
      fimGarantia: null,
      descricao: '',
      observacao: '',
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('manutencoes.form.invalid' as never),
      });
      return;
    }

    const v = this.form.getRawValue();

    const payload: ManutencaoUpsertInput = {
      equipamentoId: v.equipamentoId,
      autorizadaNome: v.autorizadaNome.trim(),
      status: v.status,
      tipoManutencao: v.tipoManutencao!,
      preco: v.preco,
      dataEnvio: toDateOnlyString(v.dataEnvio)!,
      dataRetorno: toDateOnlyString(v.dataRetorno),
      inicioGarantia: toDateOnlyString(v.inicioGarantia),
      fimGarantia: toDateOnlyString(v.fimGarantia),
      descricao: v.descricao.trim(),
      observacao: v.observacao.trim() || null,
    };

    this.saving.set(true);

    const id = this.editing()?.id;
    const req$ = id ? this.facade.update(id, payload) : this.facade.create(payload);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi(id ? ('manutencoes.form.updated' as never) : ('manutencoes.form.created' as never)),
        });
        this.close();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: err?.error?.message ?? this.i18n.tUi('manutencoes.form.saveError' as never),
        });
      },
    });
  }
}
