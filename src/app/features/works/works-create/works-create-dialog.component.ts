
import { computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
    ReactiveFormsModule,
  ],
})
export class WorksCreateDialogComponent {
  visible = input.required<boolean>();
  work = input<WorkModel | null>(null);

  @Output() saved = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
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

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(180)]],
    supplierId: ['', [Validators.required]],
    projectId: ['', [Validators.required]],
    startDate: this.fb.control<Date | null>(null, [Validators.required]),
    expectedEndDate: this.fb.control<Date | null>(null, [Validators.required]),
    actualEndDate: this.fb.control<Date | null>(null),
    initialAmount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    status: this.fb.control<WorkStatusEnum | null>(null),
  });

  constructor() {
    this.suppliersFacade.loadSupplierOptions();
    this.projectsFacade.loadAll();

    effect(() => {
      if (!this.visible()) {
        return;
      }

      const work = this.work();

      if (!work) {
        this.lastLoadedId = null;
        this.resetFormForCreate();
        return;
      }

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
    });
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
    };

    this.saving.set(true);

    const id = this.work()?.id;
    const req$ = id ? this.works.update(id, payload) : this.works.create(payload);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);

        const isEdit = !!id;

        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: isEdit ? this.i18n.tUi('works.form.updated') : this.i18n.tUi('works.form.created'),
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
          detail: this.i18n.tUi('works.form.saveError'),
        });
      },
    });
  }
}
