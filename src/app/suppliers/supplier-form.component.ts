import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

import { I18nService } from '../core/i18n/i18n.service';
import { formatPhone, formatTaxId, onlyDigits } from '../shared/utils/br-format';
import { Supplier, SupplierRequest, SupplierService } from './supplier.service';

export interface SupplierFormDialogData {
  supplier: Supplier | null;
}

/** Aceita CNPJ/CPF com ou sem máscara (pontos, barra, hífen) - valida so a quantidade de dígitos. */
function taxIdValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const digits = onlyDigits(control.value);
    if (!digits) {
      return null; // required cuida do caso vazio
    }
    return digits.length === 11 || digits.length === 14 ? null : { taxId: true };
  };
}

@Component({
    selector: 'app-supplier-form',
    imports: [ReactiveFormsModule, ButtonModule, CheckboxModule, FloatLabelModule, InputTextModule, TranslatePipe],
    templateUrl: './supplier-form.component.html',
    styleUrl: './supplier-form.component.scss'
})
export class SupplierFormComponent implements OnInit {
  supplierId: string | null = null;
  saving = false;
  form;

  private readonly data: SupplierFormDialogData;

  constructor(
    private readonly fb: FormBuilder,
    private readonly supplierService: SupplierService,
    private readonly dialogRef: DynamicDialogRef,
    private readonly messageService: MessageService,
    private readonly i18n: I18nService,
    config: DynamicDialogConfig<SupplierFormDialogData>,
  ) {
    this.data = config.data!;
    this.form = this.fb.group({
      companyName: ['', Validators.required],
      tradeName: [''],
      taxId: ['', [Validators.required, taxIdValidator()]],
      phone: [''],
      email: ['', Validators.email],
      commercialContact: [''],
      addressStreet: [''],
      addressNumber: [''],
      addressComplement: [''],
      addressNeighborhood: [''],
      addressCity: [''],
      addressState: [''],
      addressZipCode: [''],
      bankName: [''],
      bankAgency: [''],
      bankAccount: [''],
      bankAccountType: [''],
      active: [true],
    });
  }

  ngOnInit(): void {
    if (this.data.supplier) {
      this.supplierId = this.data.supplier.id;
      this.form.patchValue({
        ...this.data.supplier,
        taxId: formatTaxId(this.data.supplier.taxId),
        phone: formatPhone(this.data.supplier.phone),
      });
    }
  }

  /** Aplica a máscara de CNPJ/CPF enquanto o usuário digita. */
  onTaxIdInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatTaxId(input.value);
    input.value = formatted;
    this.form.controls.taxId.setValue(formatted, { emitEvent: false });
  }

  /** Aplica a máscara de telefone enquanto o usuário digita. */
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatPhone(input.value);
    input.value = formatted;
    this.form.controls.phone.setValue(formatted, { emitEvent: false });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('suppliers.form.reviewFields'),
      });
      return;
    }

    const value = this.form.getRawValue();
    const request: SupplierRequest = {
      companyName: value.companyName!,
      tradeName: value.tradeName,
      // Backend so aceita digitos puros (11 ou 14 pro taxId) - remove a mascara antes de enviar.
      taxId: onlyDigits(value.taxId),
      phone: onlyDigits(value.phone),
      email: value.email,
      commercialContact: value.commercialContact,
      addressStreet: value.addressStreet,
      addressNumber: value.addressNumber,
      addressComplement: value.addressComplement,
      addressNeighborhood: value.addressNeighborhood,
      addressCity: value.addressCity,
      addressState: value.addressState,
      addressZipCode: value.addressZipCode,
      bankName: value.bankName,
      bankAgency: value.bankAgency,
      bankAccount: value.bankAccount,
      bankAccountType: value.bankAccountType,
      active: value.active ?? true,
    };

    this.saving = true;
    const request$ = this.supplierId
      ? this.supplierService.update(this.supplierId, request)
      : this.supplierService.create(request);

    request$.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('suppliers.form.saveError'),
        });
      },
    });
  }
}
