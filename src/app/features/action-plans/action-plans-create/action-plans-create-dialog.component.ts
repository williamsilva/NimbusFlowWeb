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
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { UsersFacade } from '@features/facade/users.facade';
import { TicketModel } from '@models/tickets.models';
import { ActionPlansFacade } from '@features/facade/action-plans.facade';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { ActionPlanModel, ActionPlanUpsertInput } from '@models/action-plans.models';

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
  selector: 'app-action-plans-create-dialog',
  templateUrl: './action-plans-create-dialog.component.html',
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
    InputNumberModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class ActionPlansCreateDialogComponent {
  visible = input.required<boolean>();
  actionPlan = input<ActionPlanModel | null>(null);
  /** Preenche título/obra a partir de um Chamado (conversão Chamado -> Plano de Ação) - só
   *  considerado em modo criação. Ver ActionPlanService.create no backend: não existe endpoint
   *  separado de "converter", criar o plano com ticketId já é a conversão. */
  fromTicket = input<TicketModel | null>(null);

  @Output() saved = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly actionPlans = inject(ActionPlansFacade);
  readonly usersFacade = inject(UsersFacade);
  readonly responsibleOptions = this.usersFacade.options;

  readonly isEditMode = computed(() => !!this.actionPlan());
  readonly saving = signal(false);

  private lastLoadedId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    what: ['', [Validators.required, Validators.maxLength(1000)]],
    why: ['', [Validators.required, Validators.maxLength(1000)]],
    where: this.fb.control<string | null>(null, [Validators.maxLength(300)]),
    how: ['', [Validators.required, Validators.maxLength(2000)]],
    howMuch: this.fb.control<number | null>(null),
    targetDate: this.fb.control<Date | null>(null),
    responsibleId: ['', [Validators.required]],
  });

  constructor() {
    this.usersFacade.loadUsersOptions();

    effect(() => {
      if (!this.visible()) {
        return;
      }

      const plan = this.actionPlan();

      if (!plan) {
        this.lastLoadedId = null;
        const ticket = this.fromTicket();
        this.resetFormForCreate(ticket);
        return;
      }

      if (this.lastLoadedId === plan.id) {
        return;
      }

      this.lastLoadedId = plan.id;

      this.form.reset({
        title: plan.title,
        what: plan.what,
        why: plan.why,
        where: plan.where,
        how: plan.how,
        howMuch: plan.howMuch,
        targetDate: fromDateOnlyString(plan.targetDate),
        responsibleId: plan.responsibleId,
      });
    });
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.lastLoadedId = null;
    this.resetFormForCreate(null);
    this.visibleChange.emit(false);
  }

  private resetFormForCreate(ticket: TicketModel | null): void {
    this.form.reset({
      title: ticket?.title ?? '',
      what: '',
      why: '',
      where: null,
      how: '',
      howMuch: null,
      targetDate: null,
      responsibleId: '',
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('actionPlans.form.invalid'),
      });
      return;
    }

    const v = this.form.getRawValue();
    const id = this.actionPlan()?.id;

    const payload: ActionPlanUpsertInput = {
      title: v.title.trim(),
      what: v.what.trim(),
      why: v.why.trim(),
      where: v.where?.trim() || null,
      how: v.how.trim(),
      howMuch: v.howMuch,
      targetDate: toDateOnlyString(v.targetDate),
      responsibleId: v.responsibleId,
      ticketId: id ? null : (this.fromTicket()?.id ?? null),
    };

    this.saving.set(true);

    const req$ = id ? this.actionPlans.update(id, payload) : this.actionPlans.create(payload);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);

        const isEdit = !!id;

        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: isEdit
            ? this.i18n.tUi('actionPlans.form.updated')
            : this.i18n.tUi('actionPlans.form.created'),
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
          detail: this.i18n.tUi('actionPlans.form.saveError'),
        });
      },
    });
  }
}
