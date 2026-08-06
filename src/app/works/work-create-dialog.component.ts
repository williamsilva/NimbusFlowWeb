import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';

import { I18nService } from '../core/i18n/i18n.service';
import { Supplier, SupplierService } from '../suppliers/supplier.service';
import { MapPickerComponent } from './map-picker.component';
import { Work, WorkRequest, WorkService } from './work.service';

@Component({
    selector: 'app-work-create-dialog',
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatDatepickerModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MapPickerComponent,
        TranslatePipe,
    ],
    providers: [provideNativeDateAdapter()],
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
    private readonly dialogRef: MatDialogRef<WorkCreateDialogComponent>,
    private readonly snackBar: MatSnackBar,
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
      this.snackBar.open(this.i18n.tUi('works.createDialog.reviewFields'), this.i18n.tUi('common.ok'), { duration: 4000 });
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
        this.snackBar.open(this.i18n.tUi('works.createDialog.saveError'), this.i18n.tUi('common.ok'), { duration: 5000 });
      },
    });
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
