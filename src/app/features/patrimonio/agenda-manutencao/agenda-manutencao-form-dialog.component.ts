import { computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { input, signal, Output, inject, Component, EventEmitter, effect } from '@angular/core';

import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { EquipamentosFacade } from '@features/facade/equipamentos.facade';
import { AgendaManutencaoFacade } from '@features/facade/agenda-manutencao.facade';
import { AgendaManutencaoModel, AgendaManutencaoUpsertInput } from '@models/agenda-manutencao.models';
import {
  FREQUENCIA_MANUTENCAO_VALUES,
  FrequenciaManutencao,
  PERFIL_NOTIFICACAO_VALUES,
  PerfilNotificacao,
  STATUS_AGENDA_MANUTENCAO_VALUES,
  StatusAgendaManutencao,
  TIPO_MANUTENCAO_VALUES,
  TipoManutencao,
} from '@models/patrimonio-enums';

@Component({
  standalone: true,
  selector: 'app-agenda-manutencao-form-dialog',
  templateUrl: './agenda-manutencao-form-dialog.component.html',
  imports: [
    SelectModule,
    DialogModule,
    ButtonModule,
    TextareaModule,
    TranslateModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class AgendaManutencaoFormDialogComponent {
  visible = input.required<boolean>();
  editing = input<AgendaManutencaoModel | null>(null);

  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(AgendaManutencaoFacade);

  readonly i18n = inject(I18nService);
  readonly equipamentosFacade = inject(EquipamentosFacade);
  readonly equipamentoOptions = computed(() =>
    this.equipamentosFacade
      .options()
      .map((e) => ({ value: e.id, label: `${e.numeroPatrimonio} - ${e.descricao}` })),
  );

  readonly saving = signal(false);
  readonly isEditMode = computed(() => !!this.editing());

  readonly statusOptions = STATUS_AGENDA_MANUTENCAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`agendaManutencao.status.${value}` as never),
  }));

  readonly frequenciaOptions = FREQUENCIA_MANUTENCAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`agendaManutencao.frequencia.${value}` as never),
  }));

  readonly tipoOptions = TIPO_MANUTENCAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`manutencoes.tipo.${value}` as never),
  }));

  readonly perfilOptions = PERFIL_NOTIFICACAO_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`agendaManutencao.perfil.${value}` as never),
  }));

  private lastLoadedId: string | null = null;
  private createFormInitialized = false;

  readonly form = this.fb.nonNullable.group({
    equipamentoId: ['', [Validators.required]],
    status: this.fb.nonNullable.control<StatusAgendaManutencao>('AGENDADA', [Validators.required]),
    frequencia: this.fb.control<FrequenciaManutencao | null>(null, [Validators.required]),
    tipoManutencao: this.fb.control<TipoManutencao | null>(null, [Validators.required]),
    perfilNotificacao: this.fb.control<PerfilNotificacao | null>(null, [Validators.required]),
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
        status: editing.status,
        frequencia: editing.frequencia,
        tipoManutencao: editing.tipoManutencao,
        perfilNotificacao: editing.perfilNotificacao,
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
      status: 'AGENDADA',
      frequencia: null,
      tipoManutencao: null,
      perfilNotificacao: null,
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
        detail: this.i18n.tUi('agendaManutencao.form.invalid' as never),
      });
      return;
    }

    const v = this.form.getRawValue();

    const payload: AgendaManutencaoUpsertInput = {
      equipamentoId: v.equipamentoId,
      status: v.status,
      frequencia: v.frequencia!,
      tipoManutencao: v.tipoManutencao!,
      perfilNotificacao: v.perfilNotificacao!,
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
          detail: this.i18n.tUi(
            id ? ('agendaManutencao.form.updated' as never) : ('agendaManutencao.form.created' as never),
          ),
        });
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('agendaManutencao.form.saveError' as never),
        });
      },
    });
  }
}
