import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';

import { I18nService } from '@core/i18n/i18n.service';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { WorkAutoCompleteSettingsApiService } from '@features/service/work-auto-complete-settings.api.service';

@Component({
  standalone: true,
  selector: 'cs-work-auto-complete-settings',
  templateUrl: './work-auto-complete-settings.component.html',
  imports: [
    CardModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    FloatLabelModule,
    InputNumberModule,
    ReactiveFormsModule,
    PageHeaderComponent,
  ],
})
export class WorkAutoCompleteSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(MessageService);
  private readonly perms = inject(PermissionService);
  private readonly service = inject(WorkAutoCompleteSettingsApiService);

  protected readonly saving = signal(false);
  protected readonly loading = signal(false);

  protected readonly canEdit = computed(() =>
    this.perms.hasSupportOr(PERMISSIONS.SETTINGS.WORK_AUTO_COMPLETE_CHANGE),
  );

  readonly form = this.fb.group({
    daysSinceLastPayment: [5, [Validators.required, Validators.min(0), Validators.max(365)]],
    runHour: [8, [Validators.required, Validators.min(0), Validators.max(23)]],
    runMinute: [0, [Validators.required, Validators.min(0), Validators.max(59)]],
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.service.getSettings().subscribe({
      next: (s) => {
        this.form.patchValue({
          daysSinceLastPayment: s.daysSinceLastPayment,
          runHour: s.runHour,
          runMinute: s.runMinute,
        });
        if (!this.canEdit()) {
          this.form.disable();
        }
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service
      .updateSettings({
        daysSinceLastPayment: v.daysSinceLastPayment ?? 5,
        runHour: v.runHour ?? 8,
        runMinute: v.runMinute ?? 0,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('workAutoComplete.settings.saved'),
          });
        },
        error: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('workAutoComplete.settings.saveError'),
          });
        },
      });
  }
}
