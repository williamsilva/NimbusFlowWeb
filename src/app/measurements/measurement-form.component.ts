import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

import { I18nService } from '../core/i18n/i18n.service';
import { MeasurementRequest, MeasurementService } from './measurement.service';

@Component({
    selector: 'app-measurement-form',
    imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, TranslatePipe],
    templateUrl: './measurement-form.component.html',
    styleUrl: './measurement-form.component.scss'
})
export class MeasurementFormComponent implements OnInit {
  installmentId: string | null = null;
  supersedesId: string | null = null;
  selectedFiles: File[] = [];
  locationError: string | null = null;
  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly measurementService: MeasurementService,
    private readonly route: ActivatedRoute,
    private readonly location: Location,
    private readonly i18n: I18nService,
  ) {
    this.form = this.fb.group({
      description: ['', Validators.required],
      latitude: this.fb.control<number | null>(null, Validators.required),
      longitude: this.fb.control<number | null>(null, Validators.required),
    });
  }

  ngOnInit(): void {
    this.installmentId = this.route.snapshot.paramMap.get('id');
    this.supersedesId = this.route.snapshot.queryParamMap.get('supersedes');
  }

  captureLocation(): void {
    this.locationError = null;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.form.patchValue({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      },
      (error) => {
        this.locationError = this.i18n.tUi('measurements.form.locationError', { message: error.message });
      },
    );
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles = input.files ? Array.from(input.files) : [];
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: MeasurementRequest = {
      description: value.description!,
      latitude: value.latitude!,
      longitude: value.longitude!,
      supersedesId: this.supersedesId,
    };

    this.measurementService.submit(this.installmentId!, request, this.selectedFiles).subscribe(() => this.location.back());
  }
}
