
import { computed, untracked, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { input, signal, Output, inject, Component, EventEmitter, effect } from '@angular/core';

import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { WorksFacade } from '@features/facade/works.facade';
import { SuppliersFacade } from '@features/facade/suppliers.facade';
import { ProjectsFacade } from '@features/facade/projects.facade';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { DateInputMaskDirective } from '@shared/directives/date-input-mask.directive';
import { SitePlanPickerComponent } from '@shared/features/site-plan-picker/site-plan-picker.component';
import { WorksPermissionPolicy } from '@features/works/works-permission.policy';
import { WORK_STATUS_VALUES, WorkStatusEnum } from '@models/enums/work-status.enum';
import { WorkModel, WorkUpsertInput } from '@models/works.models';

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
  selector: 'app-works-create-dialog',
  templateUrl: './works-create-dialog.component.html',
  imports: [
    ToastModule,
    FormsModule,
    SelectModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TranslateModule,
    DatePickerModule,
    FloatLabelModule,
    InputNumberModule,
    ErrorMsgComponent,
    DateInputMaskDirective,
    SitePlanPickerComponent,
    ReactiveFormsModule,
  ],
})
export class WorksCreateDialogComponent {
  visible = input.required<boolean>();
  work = input<WorkModel | null>(null);
  /** Pré-preenche o nome no modo criação (ex.: "Criar nova Frente de Serviço" a partir de um
   *  Chamado - TicketsListComponent passa o título do chamado). Ignorado em modo edição. */
  initialName = input<string | null>(null);

  /** Emitem o WorkModel salvo (não só void) - consumidores que só querem recarregar a lista
   *  seguem ignorando o $event de sempre; o novo consumidor (TicketsListComponent, "abrir Frente
   *  de Serviço" a partir de um Chamado) precisa do id recém-criado pra vincular na sequência. */
  @Output() saved = new EventEmitter<WorkModel>();
  @Output() updated = new EventEmitter<WorkModel>();
  @Output() created = new EventEmitter<WorkModel>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly works = inject(WorksFacade);
  readonly policy = inject(WorksPermissionPolicy);
  readonly suppliersFacade = inject(SuppliersFacade);
  readonly supplierOptions = this.suppliersFacade.options;
  readonly projectsFacade = inject(ProjectsFacade);
  /** Só projetos Em andamento/Pausado - os únicos que aceitam novas frentes de serviço. */
  readonly projectOptions = this.projectsFacade.assignableOptions;

  readonly loadedWork = signal<WorkModel | null>(null);
  readonly isEditMode = computed(() => !!this.work());

  readonly canSubmit = computed(() =>
    this.isEditMode() ? this.policy.canEdit() : this.policy.canCreate(),
  );

  readonly saving = signal(false);

  readonly statusOptions = WORK_STATUS_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`works.status.${value}` as never),
  }));

  private lastLoadedId: string | null = null;
  /** Evita resetar o form de novo em modo criação a cada re-execução do effect() (ver
   *  constructor) - true assim que o form já foi inicializado pra este "open" do diálogo. */
  private createFormInitialized = false;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(180)]],
    supplierId: ['', [Validators.required]],
    projectId: ['', [Validators.required]],
    startDate: this.fb.control<Date | null>(null, [Validators.required]),
    expectedEndDate: this.fb.control<Date | null>(null, [Validators.required]),
    actualEndDate: this.fb.control<Date | null>(null),
    initialAmount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    status: this.fb.control<WorkStatusEnum | null>(null),
    planPositionX: this.fb.control<number | null>(null),
    planPositionY: this.fb.control<number | null>(null),
  });

  /** Planta do Projeto selecionado no form - reativo ao trocar de projeto no seletor (mesmo
   *  projeto já carregado em projectsFacade.optionsItems() pro dropdown, sem chamada extra). */
  private readonly selectedProjectId = toSignal(this.form.controls.projectId.valueChanges, {
    initialValue: this.form.controls.projectId.value,
  });
  readonly selectedProjectSiteplanUrl = computed(
    () => this.projectsFacade.optionsItems().find((p) => p.id === this.selectedProjectId())?.siteplanUrl ?? null,
  );

  constructor() {
    this.suppliersFacade.loadSupplierOptions();
    this.projectsFacade.loadOptions();

    effect(() => {
      if (!this.visible()) {
        this.createFormInitialized = false;
        return;
      }

      // Este componente nunca é destruído/recriado (fica sempre montado dentro de
      // WorksListComponent, só alternando `visible`) - sem isto, a lista de fornecedores/projetos
      // fica presa ao snapshot da primeira abertura da sessão, mesmo que um fornecedor tenha sido
      // cadastrado depois (outra aba, outro usuário, ou só o tempo passando) - reabrir o diálogo
      // nunca disparava um refetch por conta própria (só SuppliersFacade.create/update/etc.
      // invalidava, e só quando a mutação acontecia na mesma aba/sessão Angular).
      //
      // untracked() é obrigatório aqui: loadSupplierOptions/loadOptions leem um sinal de "carregando"
      // como guarda de corrida (`if (this._optionsLoading()) return;`) e, na sequência, escrevem
      // nesse MESMO sinal - sem untracked(), essa leitura síncrona dentro do effect() registra o
      // sinal como dependência dele, e a escrita imediata (true, depois false quando a resposta
      // volta) disparava o effect de novo a cada troca, entrando num loop infinito de chamadas a
      // /bff/v1/projects/options e /bff/v1/suppliers/options.
      untracked(() => {
        this.suppliersFacade.loadSupplierOptions(true);
        this.projectsFacade.loadOptions(true);
      });

      const work = this.work();

      if (!work) {
        // Sem isto, qualquer re-execução espúria do effect() (ex.: change detection disparada
        // pelo fechamento do painel de um p-select após selecionar uma opção) chamaria
        // resetFormForCreate() de novo e apagaria o que o usuário já tinha preenchido.
        if (this.createFormInitialized) {
          return;
        }
        this.createFormInitialized = true;
        this.lastLoadedId = null;
        this.resetFormForCreate();
        const initialName = this.initialName();
        if (initialName) {
          this.form.patchValue({ name: initialName });
        }
        return;
      }

      this.createFormInitialized = false;
      if (this.lastLoadedId === work.id) {
        return;
      }

      this.lastLoadedId = work.id;
      this.loadedWork.set(work);

      this.form.reset({
        name: work.name ?? '',
        supplierId: work.supplierId ?? '',
        projectId: work.projectId ?? '',
        startDate: fromDateOnlyString(work.startDate),
        expectedEndDate: fromDateOnlyString(work.expectedEndDate),
        actualEndDate: fromDateOnlyString(work.actualEndDate),
        initialAmount: work.initialAmount,
        status: work.status,
        planPositionX: work.planPositionX,
        planPositionY: work.planPositionY,
      });
    });
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.loadedWork.set(null);
    this.saving.set(false);
    this.lastLoadedId = null;
    this.createFormInitialized = false;
    this.resetFormForCreate();
    this.visibleChange.emit(false);
  }

  private resetFormForCreate(): void {
    this.loadedWork.set(null);
    this.form.reset({
      name: '',
      supplierId: '',
      projectId: '',
      startDate: null,
      expectedEndDate: null,
      actualEndDate: null,
      initialAmount: null,
      status: null,
      planPositionX: null,
      planPositionY: null,
    });
  }

  onPlanPositionChange(position: { x: number; y: number }): void {
    this.form.patchValue({ planPositionX: position.x, planPositionY: position.y });
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('works.form.invalid'),
      });
      return;
    }

    const v = this.form.getRawValue();

    const payload: WorkUpsertInput = {
      name: v.name.trim(),
      supplierId: v.supplierId,
      projectId: v.projectId,
      startDate: toDateOnlyString(v.startDate)!,
      expectedEndDate: toDateOnlyString(v.expectedEndDate)!,
      actualEndDate: toDateOnlyString(v.actualEndDate),
      initialAmount: v.initialAmount!,
      status: v.status,
      planPositionX: v.planPositionX,
      planPositionY: v.planPositionY,
    };

    this.saving.set(true);

    const id = this.work()?.id;
    const req$ = id ? this.works.update(id, payload) : this.works.create(payload);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (work) => {
        this.saving.set(false);

        const isEdit = !!id;

        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: isEdit ? this.i18n.tUi('works.form.updated') : this.i18n.tUi('works.form.created'),
        });

        if (isEdit) {
          this.updated.emit(work);
        } else {
          this.created.emit(work);
        }

        this.saved.emit(work);
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('works.form.saveError'),
        });
      },
    });
  }
}
