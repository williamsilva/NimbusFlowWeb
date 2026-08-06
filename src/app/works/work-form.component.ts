import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { Addendum, AddendumRequest, AddendumService } from '../addendums/addendum.service';
import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { Installment, InstallmentScheduleItem, InstallmentService } from '../installments/installment.service';
import { Measurement, MeasurementService } from '../measurements/measurement.service';
import { Supplier, SupplierService } from '../suppliers/supplier.service';
import { MapPickerComponent } from './map-picker.component';
import { Work, WorkRequest, WorkService, WorkStatus } from './work.service';

@Component({
    selector: 'app-work-form',
    imports: [
        DatePipe,
        DecimalPipe,
        ReactiveFormsModule,
        RouterLink,
        MatButtonModule,
        MatCardModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatTableModule,
        MapPickerComponent,
        TranslatePipe,
    ],
    providers: [provideNativeDateAdapter()],
    templateUrl: './work-form.component.html',
    styleUrl: './work-form.component.scss'
})
export class WorkFormComponent implements OnInit {
  workId: string | null = null;
  work: Work | null = null;
  suppliers: Supplier[] = [];
  statusOptions: WorkStatus[] = ['PLANNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED'];
  form;

  addendums: Addendum[] = [];
  addendumColumns = ['amount', 'justification', 'status', 'requiredTier', 'decision', 'actions'];
  addendumForm;
  permissions: string[] = [];
  resubmittingFrom: Addendum | null = null;

  installments: Installment[] = [];
  installmentColumns = ['number', 'amount', 'dueDate', 'status', 'actions'];
  pendingSchedule: InstallmentScheduleItem[] = [];
  installmentDraftForm;

  measurements: Measurement[] = [];
  measurementColumns = ['installmentNumber', 'description', 'status', 'distance', 'decision', 'media', 'actions'];

  constructor(
    private readonly fb: FormBuilder,
    private readonly workService: WorkService,
    private readonly supplierService: SupplierService,
    private readonly addendumService: AddendumService,
    private readonly installmentService: InstallmentService,
    private readonly measurementService: MeasurementService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly i18n: I18nService,
    private readonly datePipe: DatePipe,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      supplierId: ['', Validators.required],
      startDate: this.fb.control<Date | null>(null, Validators.required),
      expectedEndDate: this.fb.control<Date | null>(null, Validators.required),
      actualEndDate: this.fb.control<Date | null>(null),
      initialAmount: [0, [Validators.required, Validators.min(0.01)]],
      latitude: this.fb.control<number | null>(null, Validators.required),
      longitude: this.fb.control<number | null>(null, Validators.required),
      status: this.fb.control<WorkStatus>('PLANNED'),
    });
    this.addendumForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(0.01)]],
      justification: ['', Validators.required],
    });
    this.installmentDraftForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(0.01)]],
      dueDate: this.fb.control<Date | null>(null, Validators.required),
    });
  }

  ngOnInit(): void {
    this.supplierService.list().subscribe((suppliers) => (this.suppliers = suppliers.filter((s) => s.active)));

    this.workId = this.route.snapshot.paramMap.get('id');
    if (this.workId) {
      this.loadWork();
      this.authService.loadMe().subscribe((user) => (this.permissions = user.permissions));
      this.loadAddendums();
      this.loadInstallments();
    }
  }

  loadWork(): void {
    this.workService.get(this.workId!).subscribe((work) => {
      this.work = work;
      this.form.patchValue({
        name: work.name,
        supplierId: work.supplierId,
        startDate: new Date(work.startDate),
        expectedEndDate: new Date(work.expectedEndDate),
        actualEndDate: work.actualEndDate ? new Date(work.actualEndDate) : null,
        initialAmount: work.initialAmount,
        latitude: work.latitude,
        longitude: work.longitude,
        status: work.status,
      });
    });
  }

  loadAddendums(): void {
    this.addendumService.listByWork(this.workId!).subscribe((addendums) => (this.addendums = addendums));
  }

  statusLabelKey(status: WorkStatus): string {
    return `works.status.${status}`;
  }

  addendumDecisionLabel(addendum: Addendum): string {
    return this.i18n.tUi('works.form.addendum.decisionBy', {
      by: addendum.approvedById,
      date: this.datePipe.transform(addendum.decisionDate, 'short') ?? '',
    });
  }

  measurementDecisionLabel(measurement: Measurement): string {
    return this.i18n.tUi('works.form.measurement.decisionBy', {
      by: measurement.approvedById,
      date: this.datePipe.transform(measurement.decisionDate, 'short') ?? '',
    });
  }

  /** Só é UX (esconder botão) - a validação de verdade é sempre revalidada no backend. */
  canDecide(addendum: Addendum): boolean {
    return this.permissions.includes(`ADITIVO_APPROVE_${addendum.requiredTier}`);
  }

  startResubmit(addendum: Addendum): void {
    this.resubmittingFrom = addendum;
    this.addendumForm.patchValue({ amount: addendum.amount, justification: addendum.justification });
  }

  cancelResubmit(): void {
    this.resubmittingFrom = null;
    this.addendumForm.reset({ amount: 0, justification: '' });
  }

  submitAddendum(): void {
    if (this.addendumForm.invalid) {
      this.addendumForm.markAllAsTouched();
      return;
    }

    const value = this.addendumForm.getRawValue();
    const request: AddendumRequest = {
      amount: value.amount!,
      justification: value.justification!,
      supersedesId: this.resubmittingFrom?.id ?? null,
    };

    this.addendumService.submit(this.workId!, request).subscribe(() => {
      this.cancelResubmit();
      this.loadAddendums();
    });
  }

  approve(addendum: Addendum, decisionNote: string): void {
    this.addendumService.approve(addendum.id, { decisionNote: decisionNote || null }).subscribe(() => {
      this.loadAddendums();
      this.loadWork();
    });
  }

  reject(addendum: Addendum, decisionNote: string): void {
    this.addendumService.reject(addendum.id, { decisionNote: decisionNote || null }).subscribe(() => this.loadAddendums());
  }

  loadInstallments(): void {
    this.installmentService.listByWork(this.workId!).subscribe((installments) => {
      this.installments = installments;
      this.loadMeasurements();
    });
  }

  loadMeasurements(): void {
    if (this.installments.length === 0) {
      this.measurements = [];
      return;
    }
    forkJoin(this.installments.map((i) => this.measurementService.listByInstallment(i.id))).subscribe((results) => {
      this.measurements = results.flat();
    });
  }

  installmentNumber(measurement: Measurement): number | null {
    return this.installments.find((i) => i.id === measurement.installmentId)?.number ?? null;
  }

  addInstallmentRow(): void {
    if (this.installmentDraftForm.invalid) {
      this.installmentDraftForm.markAllAsTouched();
      return;
    }
    const value = this.installmentDraftForm.getRawValue();
    this.pendingSchedule.push({ amount: value.amount!, dueDate: this.toIsoDate(value.dueDate!) });
    this.installmentDraftForm.reset({ amount: 0, dueDate: null });
  }

  removeInstallmentRow(index: number): void {
    this.pendingSchedule.splice(index, 1);
  }

  submitSchedule(): void {
    if (this.pendingSchedule.length === 0) {
      return;
    }
    this.installmentService.schedule(this.workId!, { installments: this.pendingSchedule }).subscribe(() => {
      this.pendingSchedule = [];
      this.loadInstallments();
    });
  }

  /** Só é UX (esconder botão) - a validação de verdade é sempre revalidada no backend. */
  canCreateMeasurement(): boolean {
    return this.permissions.includes('MEDICAO_CREATE');
  }

  canDecideMeasurement(): boolean {
    return this.permissions.includes('MEDICAO_APPROVE');
  }

  canRelease(): boolean {
    return this.permissions.includes('PARCELA_LIBERAR');
  }

  canMarkAsPaid(): boolean {
    return this.permissions.includes('PARCELA_PAGAR');
  }

  release(installment: Installment): void {
    this.installmentService.release(installment.id).subscribe(() => this.loadInstallments());
  }

  markAsPaid(installment: Installment): void {
    this.installmentService.markAsPaid(installment.id).subscribe(() => this.loadInstallments());
  }

  approveMeasurement(measurement: Measurement, decisionNote: string): void {
    this.measurementService.approve(measurement.id, { decisionNote: decisionNote || null }).subscribe(() => this.loadInstallments());
  }

  rejectMeasurement(measurement: Measurement, decisionNote: string): void {
    this.measurementService.reject(measurement.id, { decisionNote: decisionNote || null }).subscribe(() => this.loadInstallments());
  }

  onPositionChange(position: { latitude: number; longitude: number }): void {
    this.form.patchValue({ latitude: position.latitude, longitude: position.longitude });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: WorkRequest = {
      name: value.name!,
      supplierId: value.supplierId!,
      startDate: this.toIsoDate(value.startDate!),
      expectedEndDate: this.toIsoDate(value.expectedEndDate!),
      actualEndDate: value.actualEndDate ? this.toIsoDate(value.actualEndDate) : null,
      initialAmount: value.initialAmount!,
      latitude: value.latitude!,
      longitude: value.longitude!,
      status: value.status,
    };

    this.workService.update(this.workId!, request).subscribe(() => this.loadWork());
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
