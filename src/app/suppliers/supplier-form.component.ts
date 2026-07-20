import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { SupplierRequest, SupplierService } from './supplier.service';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatCheckboxModule, MatFormFieldModule, MatInputModule],
  templateUrl: './supplier-form.component.html',
  styleUrl: './supplier-form.component.scss',
})
export class SupplierFormComponent implements OnInit {
  supplierId: string | null = null;
  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly supplierService: SupplierService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
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
    this.supplierId = this.route.snapshot.paramMap.get('id');
    if (this.supplierId) {
      this.supplierService.get(this.supplierId).subscribe((supplier) => this.form.patchValue(supplier));
    }
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

    const request$ = this.supplierId
      ? this.supplierService.update(this.supplierId, request)
      : this.supplierService.create(request);

    request$.subscribe(() => this.router.navigateByUrl('/suppliers'));
  }
}
