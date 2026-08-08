import { computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { input, signal, Output, inject, Component, EventEmitter, effect } from '@angular/core';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { SuppliersFacade } from '@features/facade/suppliers.facade';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { onlyDigits, formatTaxId, formatPhone } from '@shared/utils/br-format';
import { SuppliersPermissionPolicy } from '@features/suppliers/suppliers-permission.policy';
import { SupplierModel, SupplierUpsertInput } from '@models/suppliers.models';

/** Exige, após remover não-dígitos, exatamente 11 (CPF) ou 14 (CNPJ) dígitos - mesma regra do
 *  backend (SupplierRequest.taxId, regex `\d{11}|\d{14}`). */
function taxIdValidator(): ValidatorFn {
  return (control): ValidationErrors | null => {
    const value = (control.value ?? '').toString();
    if (!value.trim()) {
      return null;
    }
    const len = onlyDigits(value).length;
    return len === 11 || len === 14 ? null : { taxIdInvalid: true };
  };
}

@Component({
  standalone: true,
  selector: 'app-suppliers-create-dialog',
  templateUrl: './suppliers-create-dialog.component.html',
  imports: [
    ToastModule,
    DialogModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    TranslateModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class SuppliersCreateDialogComponent {
  visible = input.required<boolean>();
  supplier = input<SupplierModel | null>(null);

  @Output() saved = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly suppliers = inject(SuppliersFacade);
  readonly policy = inject(SuppliersPermissionPolicy);

  readonly loadedSupplier = signal<SupplierModel | null>(null);
  readonly isEditMode = computed(() => !!this.supplier());

  readonly canSubmit = computed(() =>
    this.isEditMode() ? this.policy.canEdit() : this.policy.canCreate(),
  );

  readonly saving = signal(false);

  private lastLoadedId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    companyName: ['', [Validators.required, Validators.maxLength(180)]],
    tradeName: ['', [Validators.maxLength(180)]],
    taxId: ['', [Validators.required, taxIdValidator()]],
    phone: [''],
    email: ['', [Validators.email]],
    commercialContact: ['', [Validators.maxLength(120)]],
    addressStreet: [''],
    addressNumber: [''],
    addressComplement: [''],
    addressNeighborhood: [''],
    addressCity: [''],
    addressState: ['', [Validators.maxLength(2)]],
    addressZipCode: [''],
    bankName: [''],
    bankAgency: [''],
    bankAccount: [''],
    bankAccountType: [''],
    active: [true],
  });

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }

      const supplier = this.supplier();

      if (!supplier) {
        this.lastLoadedId = null;
        this.resetFormForCreate();
        return;
      }

      if (this.lastLoadedId === supplier.id) {
        return;
      }

      this.lastLoadedId = supplier.id;
      this.loadedSupplier.set(supplier);

      this.form.reset({
        companyName: supplier.companyName ?? '',
        tradeName: supplier.tradeName ?? '',
        taxId: formatTaxId(supplier.taxId),
        phone: supplier.phone ? formatPhone(supplier.phone) : '',
        email: supplier.email ?? '',
        commercialContact: supplier.commercialContact ?? '',
        addressStreet: supplier.addressStreet ?? '',
        addressNumber: supplier.addressNumber ?? '',
        addressComplement: supplier.addressComplement ?? '',
        addressNeighborhood: supplier.addressNeighborhood ?? '',
        addressCity: supplier.addressCity ?? '',
        addressState: supplier.addressState ?? '',
        addressZipCode: supplier.addressZipCode ?? '',
        bankName: supplier.bankName ?? '',
        bankAgency: supplier.bankAgency ?? '',
        bankAccount: supplier.bankAccount ?? '',
        bankAccountType: supplier.bankAccountType ?? '',
        active: supplier.active,
      });
    });
  }

  onTaxIdInput(value: string): void {
    this.form.controls.taxId.setValue(formatTaxId(value));
  }

  onPhoneInput(value: string): void {
    this.form.controls.phone.setValue(formatPhone(value));
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.loadedSupplier.set(null);
    this.saving.set(false);
    this.lastLoadedId = null;
    this.resetFormForCreate();
    this.visibleChange.emit(false);
  }

  private resetFormForCreate(): void {
    this.loadedSupplier.set(null);
    this.form.reset({
      companyName: '',
      tradeName: '',
      taxId: '',
      phone: '',
      email: '',
      commercialContact: '',
      addressStreet: '',
      addressNumber: '',
      addressComplement: '',
      addressNeighborhood: '',
      addressCity: '',
      addressState: '',
      addressZipCode: '',
      bankName: '',
      bankAgency: '',
      bankAccount: '',
      bankAccountType: '',
      active: true,
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.focusFirstInvalid();
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('suppliers.form.invalid'),
      });
      return;
    }

    const v = this.form.getRawValue();

    const payload: SupplierUpsertInput = {
      companyName: v.companyName.trim(),
      tradeName: v.tradeName.trim() || null,
      taxId: onlyDigits(v.taxId),
      phone: v.phone ? onlyDigits(v.phone) : null,
      email: v.email.trim() || null,
      commercialContact: v.commercialContact.trim() || null,
      addressStreet: v.addressStreet.trim() || null,
      addressNumber: v.addressNumber.trim() || null,
      addressComplement: v.addressComplement.trim() || null,
      addressNeighborhood: v.addressNeighborhood.trim() || null,
      addressCity: v.addressCity.trim() || null,
      addressState: v.addressState.trim() || null,
      addressZipCode: v.addressZipCode.trim() || null,
      bankName: v.bankName.trim() || null,
      bankAgency: v.bankAgency.trim() || null,
      bankAccount: v.bankAccount.trim() || null,
      bankAccountType: v.bankAccountType.trim() || null,
      active: v.active,
    };

    this.saving.set(true);

    const id = this.supplier()?.id;
    const req$ = id ? this.suppliers.update(id, payload) : this.suppliers.create(payload);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);

        const isEdit = !!id;

        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: isEdit
            ? this.i18n.tUi('suppliers.form.updated')
            : this.i18n.tUi('suppliers.form.created'),
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
          detail: this.i18n.tUi('suppliers.form.saveError'),
        });
      },
    });
  }

  private focusFirstInvalid(): void {
    const firstInvalidName = Object.keys(this.form.controls).find(
      (key) => this.form.controls[key as keyof typeof this.form.controls].invalid,
    );

    if (!firstInvalidName) {
      return;
    }

    const el =
      document.getElementById(firstInvalidName) ||
      document.querySelector<HTMLElement>(`[formcontrolname="${firstInvalidName}"]`);

    if (!el) {
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const focusTarget =
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
        ? el
        : ((el.querySelector('input,textarea,[tabindex],button') as HTMLElement | null) ?? el);

    setTimeout(() => focusTarget.focus(), 80);
  }
}
