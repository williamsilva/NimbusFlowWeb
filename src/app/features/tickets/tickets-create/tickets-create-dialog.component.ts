import { DestroyRef } from '@angular/core';
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
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { UsersFacade } from '@features/facade/users.facade';
import { TicketsFacade } from '@features/facade/tickets.facade';
import { DepartmentsFacade } from '@features/facade/departments.facade';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { TICKET_TYPE_VALUES, TicketTypeEnum } from '@models/enums/ticket-type.enum';
import { TICKET_PRIORITY_VALUES, TicketPriorityEnum } from '@models/enums/ticket-priority.enum';
import {
  TICKET_TARGET_TYPE_VALUES,
  TicketTargetTypeEnum,
  ticketTargetTypeLabel,
} from '@models/enums/ticket-target-type.enum';

@Component({
  standalone: true,
  selector: 'app-tickets-create-dialog',
  templateUrl: './tickets-create-dialog.component.html',
  imports: [
    ToastModule,
    SelectModule,
    DialogModule,
    ButtonModule,
    TextareaModule,
    TranslateModule,
    InputTextModule,
    FloatLabelModule,
    SelectButtonModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class TicketsCreateDialogComponent {
  visible = input.required<boolean>();

  @Output() saved = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly usersFacade = inject(UsersFacade);
  private readonly departmentsFacade = inject(DepartmentsFacade);

  readonly i18n = inject(I18nService);
  readonly tickets = inject(TicketsFacade);

  readonly saving = signal(false);
  readonly selectedFile = signal<File | null>(null);

  readonly userOptions = this.usersFacade.options;
  readonly departmentOptions = this.departmentsFacade.options;

  readonly typeOptions = TICKET_TYPE_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`tickets.type.${value}` as never),
  }));

  readonly priorityOptions = TICKET_PRIORITY_VALUES.map((value) => ({
    value,
    label: this.i18n.tUi(`tickets.priority.${value}` as never),
  }));

  readonly targetTypeOptions = TICKET_TARGET_TYPE_VALUES.map((value) => ({
    value,
    label: ticketTargetTypeLabel(value, this.i18n),
  }));

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    type: this.fb.control<TicketTypeEnum | null>(null, [Validators.required]),
    priority: this.fb.control<TicketPriorityEnum | null>(null, [Validators.required]),
    targetType: this.fb.nonNullable.control<TicketTargetTypeEnum>(TicketTargetTypeEnum.USER, [Validators.required]),
    targetUserId: this.fb.control<string | null>(null, [Validators.required]),
    targetDepartmentId: this.fb.control<string | null>(null),
  });

  readonly TicketTargetTypeEnum = TicketTargetTypeEnum;

  constructor() {
    this.usersFacade.loadUsersOptions();
    this.departmentsFacade.loadOptions();

    effect(() => {
      if (this.visible()) {
        return;
      }
      this.reset();
    });

    // Só um dos dois (targetUserId/targetDepartmentId) é obrigatório por vez, de acordo com o
    // toggle - o outro é limpo e perde a validação, pra não bloquear o save com um campo escondido
    // e vazio (mesma obrigatoriedade cruzada validada de novo no backend, ver TicketRequest).
    this.form.controls.targetType.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((targetType) => {
      this.applyTargetValidators(targetType);
    });
  }

  private applyTargetValidators(targetType: TicketTargetTypeEnum): void {
    if (targetType === TicketTargetTypeEnum.USER) {
      this.form.controls.targetDepartmentId.setValue(null);
      this.form.controls.targetDepartmentId.clearValidators();
      this.form.controls.targetUserId.setValidators([Validators.required]);
    } else {
      this.form.controls.targetUserId.setValue(null);
      this.form.controls.targetUserId.clearValidators();
      this.form.controls.targetDepartmentId.setValidators([Validators.required]);
    }
    this.form.controls.targetUserId.updateValueAndValidity();
    this.form.controls.targetDepartmentId.updateValueAndValidity();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.reset();
    this.visibleChange.emit(false);
  }

  private reset(): void {
    this.form.reset({
      title: '',
      description: '',
      type: null,
      priority: null,
      targetType: TicketTargetTypeEnum.USER,
      targetUserId: null,
      targetDepartmentId: null,
    });
    this.applyTargetValidators(TicketTargetTypeEnum.USER);
    this.selectedFile.set(null);
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('tickets.form.invalid'),
      });
      return;
    }

    const v = this.form.getRawValue();

    this.saving.set(true);

    this.tickets
      .create({
        title: v.title.trim(),
        description: v.description.trim(),
        type: v.type!,
        priority: v.priority!,
        targetType: v.targetType,
        targetUserId: v.targetType === TicketTargetTypeEnum.USER ? v.targetUserId : null,
        targetDepartmentId: v.targetType === TicketTargetTypeEnum.DEPARTMENT ? v.targetDepartmentId : null,
        attachment: this.selectedFile(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);

          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tickets.form.created'),
          });

          this.created.emit();
          this.saved.emit();
          this.close();
        },
        error: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tickets.form.saveError'),
          });
        },
      });
  }
}
