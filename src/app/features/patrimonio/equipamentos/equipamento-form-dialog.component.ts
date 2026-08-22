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
import { DateInputMaskDirective } from '@shared/directives/date-input-mask.directive';
import { EquipamentosFacade } from '@features/facade/equipamentos.facade';
import { EquipamentoModel, EquipamentoUpsertInput } from '@models/equipamentos.models';
import {
  STATUS_EQUIPAMENTO_VALUES,
  StatusEquipamento,
  VOLTAGEM_EQUIPAMENTO_VALUES,
  VoltagemEquipamento,
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
  selector: 'app-equipamento-form-dialog',
  templateUrl: './equipamento-form-dialog.component.html',
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
export class EquipamentoFormDialogComponent {
  visible = input.required<boolean>();
  editing = input<EquipamentoModel | null>(null);

  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(EquipamentosFacade);

  readonly i18n = inject(I18nService);
  readonly saving = signal(false);
  readonly isEditMode = computed(() => !!this.editing());

  readonly statusOptions = STATUS_EQUIPAMENTO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`equipamentos.status.${value}` as never),
  }));

  readonly voltagemOptions = VOLTAGEM_EQUIPAMENTO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`equipamentos.voltagem.${value}` as never),
  }));

  private lastLoadedId: string | null = null;
  private createFormInitialized = false;

  readonly form = this.fb.nonNullable.group({
    numeroPatrimonio: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    descricao: ['', [Validators.required, Validators.maxLength(255)]],
    fornecedorNome: ['', [Validators.required, Validators.maxLength(200)]],
    status: this.fb.control<StatusEquipamento>('ATIVO', [Validators.required]),
    voltagem: this.fb.control<VoltagemEquipamento | null>(null),
    preco: this.fb.control<number | null>(null),
    dataCompra: this.fb.control<Date | null>(null),
    dataChegada: this.fb.control<Date | null>(null),
    inicioGarantia: this.fb.control<Date | null>(null),
    fimGarantia: this.fb.control<Date | null>(null),
    observacao: ['', [Validators.maxLength(200)]],
  });

  constructor() {
    effect(() => {
      if (!this.visible()) {
        this.createFormInitialized = false;
        return;
      }

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
        numeroPatrimonio: editing.numeroPatrimonio,
        descricao: editing.descricao,
        fornecedorNome: editing.fornecedorNome,
        status: editing.status,
        voltagem: editing.voltagem,
        preco: editing.preco,
        dataCompra: fromDateOnlyString(editing.dataCompra),
        dataChegada: fromDateOnlyString(editing.dataChegada),
        inicioGarantia: fromDateOnlyString(editing.inicioGarantia),
        fimGarantia: fromDateOnlyString(editing.fimGarantia),
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
      numeroPatrimonio: null,
      descricao: '',
      fornecedorNome: '',
      status: 'ATIVO',
      voltagem: null,
      preco: null,
      dataCompra: null,
      dataChegada: null,
      inicioGarantia: null,
      fimGarantia: null,
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
        detail: this.i18n.tUi('equipamentos.form.invalid' as never),
      });
      return;
    }

    const v = this.form.getRawValue();

    const payload: EquipamentoUpsertInput = {
      numeroPatrimonio: v.numeroPatrimonio!,
      descricao: v.descricao.trim(),
      fornecedorNome: v.fornecedorNome.trim(),
      status: v.status,
      voltagem: v.voltagem,
      preco: v.preco,
      dataCompra: toDateOnlyString(v.dataCompra),
      dataChegada: toDateOnlyString(v.dataChegada),
      inicioGarantia: toDateOnlyString(v.inicioGarantia),
      fimGarantia: toDateOnlyString(v.fimGarantia),
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
          detail: this.i18n.tUi(id ? ('equipamentos.form.updated' as never) : ('equipamentos.form.created' as never)),
        });
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('equipamentos.form.saveError' as never),
        });
      },
    });
  }
}
