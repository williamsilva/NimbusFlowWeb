import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { Addendum, AddendumRequest, AddendumService } from '../addendums/addendum.service';
import { AuthService } from '../core/auth/auth.service';
import { Supplier, SupplierService } from '../suppliers/supplier.service';
import { MapPickerComponent } from './map-picker.component';
import { Work, WorkRequest, WorkService, WorkStatus } from './work.service';

@Component({
  selector: 'app-work-form',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MapPickerComponent,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './work-form.component.html',
  styleUrl: './work-form.component.scss',
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

  constructor(
    private readonly fb: FormBuilder,
    private readonly workService: WorkService,
    private readonly supplierService: SupplierService,
    private readonly addendumService: AddendumService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
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
  }

  ngOnInit(): void {
    this.supplierService.list().subscribe((suppliers) => (this.suppliers = suppliers.filter((s) => s.active)));

    this.workId = this.route.snapshot.paramMap.get('id');
    if (this.workId) {
      this.loadWork();
      this.authService.loadMe().subscribe((user) => (this.permissions = user.permissions));
      this.loadAddendums();
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

    const request$ = this.workId ? this.workService.update(this.workId, request) : this.workService.create(request);
    request$.subscribe(() => this.router.navigateByUrl('/works'));
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
