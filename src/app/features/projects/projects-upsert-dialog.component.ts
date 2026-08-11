import { computed, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { input, Output, inject, Component, EventEmitter, effect } from '@angular/core';

import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';

import { I18nService } from '@core/i18n/i18n.service';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { ProjectsFacade } from '@features/facade/projects.facade';
import { ProjectModel } from '@models/projects.models';
import { PROJECT_STATUS_VALUES, ProjectStatusEnum } from '@models/enums/project-status.enum';
import { translateWorksErrorDetail } from '@features/works/works-error.util';

@Component({
  standalone: true,
  selector: 'app-projects-upsert-dialog',
  templateUrl: './projects-upsert-dialog.component.html',
  imports: [
    SelectModule,
    DialogModule,
    ButtonModule,
    TranslateModule,
    TextareaModule,
    FloatLabelModule,
    InputTextModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class ProjectsUpsertDialogComponent {
  visible = input.required<boolean>();
  project = input<ProjectModel | null>(null);

  @Output() saved = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly facade = inject(ProjectsFacade);

  readonly saving = signal(false);
  readonly isEditMode = computed(() => !!this.project());

  readonly statusOptions = computed(() => {
    this.i18n.getAppliedLang();
    return PROJECT_STATUS_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`projects.status.${value}` as never),
    }));
  });

  private lastLoadedId: string | null = null;

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(200)]),
    description: this.fb.control<string | null>(null, [Validators.maxLength(1000)]),
    status: this.fb.control<ProjectStatusEnum>(ProjectStatusEnum.PLANNED, [Validators.required]),
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      const project = this.project();

      if (!project) {
        this.lastLoadedId = null;
        this.resetFormForCreate();
        return;
      }

      if (this.lastLoadedId === project.id) return;
      this.lastLoadedId = project.id;

      this.form.reset({
        name: project.name,
        description: project.description,
        status: project.status,
      });
    });
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.lastLoadedId = null;
    this.resetFormForCreate();
    this.visibleChange.emit(false);
  }

  private resetFormForCreate(): void {
    this.form.reset({ name: '', description: null, status: ProjectStatusEnum.PLANNED });
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('projects.form.invalid'),
      });
      return;
    }

    const v = this.form.getRawValue();
    const payload = { name: v.name.trim(), description: v.description?.trim() || null, status: v.status };

    this.saving.set(true);
    const id = this.project()?.id;
    const request = id ? this.facade.update(id, payload) : this.facade.create(payload);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi(id ? 'projects.form.updated' : 'projects.form.created'),
        });
        this.saved.emit();
        this.close();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: translateWorksErrorDetail(err, this.i18n) ?? this.i18n.tUi('projects.form.saveError'),
        });
      },
    });
  }
}
