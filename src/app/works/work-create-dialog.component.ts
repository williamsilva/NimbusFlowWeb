import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';

import { I18nService } from '../core/i18n/i18n.service';
import { Supplier, SupplierService } from '../suppliers/supplier.service';
import { MapPickerComponent } from './map-picker.component';
import { Work, WorkRequest, WorkService } from './work.service';

@Component({
    selector: 'app-work-create-dialog',
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        DatePickerModule,
        FloatLabelModule,
        InputTextModule,
        SelectModule,
        MapPickerComponent,
        TranslatePipe,
    ],
    templateUrl: './work-create-dialog.component.html',
    styleUrl: './work-create-dialog.component.scss'
})
export class WorkCreateDialogComponent implements OnInit {
  suppliers: Supplier[] = [];
  saving = false;
  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly workService: WorkService,
    private readonly supplierService: SupplierService,
    private readonly dialogRef: DynamicDialogRef,
    private readonly messageService: MessageService,
    private readonly i18n: I18nService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      supplierId: ['', Validators.required],
      startDate: [null as Date | null, Validators.required],
      expectedEndDate: [null as Date | null, Validators.required],
      initialAmount: [null as number | null, Validators.required],
      latitude: [null as number | null],
      longitude: [null as number | null],
    });
  }

  ngOnInit(): void {
    this.supplierService.list().subscribe((suppliers) => (this.suppliers = suppliers.filter((s) => s.active)));
  }

  onPositionChange(position: { latitude: number; longitude: number }): void {
    this.form.patchValue(position);
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
        detail: this.i18n.tUi('works.createDialog.reviewFields'),
      });
      return;
    }

    const value = this.form.getRawValue();
    const request: WorkRequest = {
      name: value.name!,
      supplierId: value.supplierId!,
      startDate: this.toIsoDate(value.startDate!),
      expectedEndDate: this.toIsoDate(value.expectedEndDate!),
      actualEndDate: null,
      initialAmount: value.initialAmount!,
      latitude: value.latitude ?? 0,
      longitude: value.longitude ?? 0,
      status: null,
    };

    this.saving = true;
    this.workService.create(request).subscribe({
      next: (work: Work) => this.dialogRef.close(work),
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('works.createDialog.saveError'),
        });
      },
    });
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
