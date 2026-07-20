import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Supplier, SupplierRequest, SupplierService } from './supplier.service';

export interface SupplierFormDialogData {
  supplier: Supplier | null;
}

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './supplier-form.component.html',
  styleUrl: './supplier-form.component.scss',
})
export class SupplierFormComponent implements OnInit {
  supplierId: string | null = null;
  saving = false;
  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly supplierService: SupplierService,
    private readonly dialogRef: MatDialogRef<SupplierFormComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly data: SupplierFormDialogData,
  ) {
    this.form = this.fb.group({
      companyName: ['', Validators.required],
      tradeName: [''],
      taxId: ['', [Validators.required, Validators.pattern(/^\d{11}(\d{3})?$/)]],
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
      this.form.patchValue(this.data.supplier);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: SupplierRequest = {
      companyName: value.companyName!,
      tradeName: value.tradeName,
      taxId: value.taxId!,
      phone: value.phone,
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
      error: () => (this.saving = false),
    });
  }
}
