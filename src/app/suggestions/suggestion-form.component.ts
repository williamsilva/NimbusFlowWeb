import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { SuggestionRequest, SuggestionService } from './suggestion.service';

@Component({
  selector: 'app-suggestion-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './suggestion-form.component.html',
  styleUrl: './suggestion-form.component.scss',
})
export class SuggestionFormComponent {
  selectedFile: File | null = null;
  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly suggestionService: SuggestionService,
    private readonly router: Router,
  ) {
    this.form = this.fb.group({
      description: ['', Validators.required],
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request: SuggestionRequest = { description: this.form.getRawValue().description! };
    this.suggestionService.create(request, this.selectedFile).subscribe(() => this.router.navigateByUrl('/suggestions'));
  }
}
