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
import { ProjectAutoCompleteSettingsApiService } from '@features/service/project-auto-complete-settings.api.service';
import { SupplierAutoDeactivateSettingsApiService } from '@features/service/supplier-auto-deactivate-settings.api.service';

/** Página "Configurações > Conclusão Automática" - 3 blocos independentes (Frente de Serviço,
 *  Projeto, Fornecedor), cada um com sua própria carência/horário/permissão (decisão do usuário
 *  2026-09-18: mesma tela, blocos separados, em vez de 3 telas dedicadas). */
@Component({
  standalone: true,
  selector: 'app-work-auto-complete-settings',
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
  private readonly workService = inject(WorkAutoCompleteSettingsApiService);
  private readonly projectService = inject(ProjectAutoCompleteSettingsApiService);
  private readonly supplierService = inject(SupplierAutoDeactivateSettingsApiService);

  protected readonly canViewWork = computed(() =>
    this.perms.hasSupportOr(PERMISSIONS.SETTINGS.WORK_AUTO_COMPLETE_VIEW),
  );
  protected readonly canEditWork = computed(() =>
    this.perms.hasSupportOr(PERMISSIONS.SETTINGS.WORK_AUTO_COMPLETE_CHANGE),
  );
  protected readonly canViewProject = computed(() =>
    this.perms.hasSupportOr(PERMISSIONS.SETTINGS.PROJECT_AUTO_COMPLETE_VIEW),
  );
  protected readonly canEditProject = computed(() =>
    this.perms.hasSupportOr(PERMISSIONS.SETTINGS.PROJECT_AUTO_COMPLETE_CHANGE),
  );
  protected readonly canViewSupplier = computed(() =>
    this.perms.hasSupportOr(PERMISSIONS.SETTINGS.SUPPLIER_AUTO_DEACTIVATE_VIEW),
  );
  protected readonly canEditSupplier = computed(() =>
    this.perms.hasSupportOr(PERMISSIONS.SETTINGS.SUPPLIER_AUTO_DEACTIVATE_CHANGE),
  );

  protected readonly loadingWork = signal(false);
  protected readonly savingWork = signal(false);
  protected readonly loadingProject = signal(false);
  protected readonly savingProject = signal(false);
  protected readonly loadingSupplier = signal(false);
  protected readonly savingSupplier = signal(false);

  readonly workForm = this.fb.group({
    daysSinceLastPayment: [5, [Validators.required, Validators.min(0), Validators.max(365)]],
    runHour: [8, [Validators.required, Validators.min(0), Validators.max(23)]],
    runMinute: [0, [Validators.required, Validators.min(0), Validators.max(59)]],
  });

  readonly projectForm = this.fb.group({
    daysSinceLastPayment: [5, [Validators.required, Validators.min(0), Validators.max(365)]],
    runHour: [8, [Validators.required, Validators.min(0), Validators.max(23)]],
    runMinute: [30, [Validators.required, Validators.min(0), Validators.max(59)]],
  });

  readonly supplierForm = this.fb.group({
    daysWithoutActiveProject: [90, [Validators.required, Validators.min(0), Validators.max(3650)]],
    runHour: [9, [Validators.required, Validators.min(0), Validators.max(23)]],
    runMinute: [0, [Validators.required, Validators.min(0), Validators.max(59)]],
  });

  constructor() {
    if (this.canViewWork()) {
      this.loadWork();
    }
    if (this.canViewProject()) {
      this.loadProject();
    }
    if (this.canViewSupplier()) {
      this.loadSupplier();
    }
  }

  protected loadWork(): void {
    this.loadingWork.set(true);
    this.workService.getSettings().subscribe({
      next: (s) => {
        this.workForm.patchValue({
          daysSinceLastPayment: s.daysSinceLastPayment,
          runHour: s.runHour,
          runMinute: s.runMinute,
        });
        if (!this.canEditWork()) {
          this.workForm.disable();
        }
      },
      error: () => this.loadingWork.set(false),
      complete: () => this.loadingWork.set(false),
    });
  }

  protected saveWork(): void {
    this.workForm.markAllAsTouched();
    if (this.workForm.invalid) return;

    const v = this.workForm.getRawValue();
    this.savingWork.set(true);
    this.workService
      .updateSettings({
        daysSinceLastPayment: v.daysSinceLastPayment ?? 5,
        runHour: v.runHour ?? 8,
        runMinute: v.runMinute ?? 0,
      })
      .subscribe({
        next: () => {
          this.savingWork.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('workAutoComplete.settings.saved'),
          });
        },
        error: () => {
          this.savingWork.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('workAutoComplete.settings.saveError'),
          });
        },
      });
  }

  protected loadProject(): void {
    this.loadingProject.set(true);
    this.projectService.getSettings().subscribe({
      next: (s) => {
        this.projectForm.patchValue({
          daysSinceLastPayment: s.daysSinceLastPayment,
          runHour: s.runHour,
          runMinute: s.runMinute,
        });
        if (!this.canEditProject()) {
          this.projectForm.disable();
        }
      },
      error: () => this.loadingProject.set(false),
      complete: () => this.loadingProject.set(false),
    });
  }

  protected saveProject(): void {
    this.projectForm.markAllAsTouched();
    if (this.projectForm.invalid) return;

    const v = this.projectForm.getRawValue();
    this.savingProject.set(true);
    this.projectService
      .updateSettings({
        daysSinceLastPayment: v.daysSinceLastPayment ?? 5,
        runHour: v.runHour ?? 8,
        runMinute: v.runMinute ?? 30,
      })
      .subscribe({
        next: () => {
          this.savingProject.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('projectAutoComplete.settings.saved'),
          });
        },
        error: () => {
          this.savingProject.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('projectAutoComplete.settings.saveError'),
          });
        },
      });
  }

  protected loadSupplier(): void {
    this.loadingSupplier.set(true);
    this.supplierService.getSettings().subscribe({
      next: (s) => {
        this.supplierForm.patchValue({
          daysWithoutActiveProject: s.daysWithoutActiveProject,
          runHour: s.runHour,
          runMinute: s.runMinute,
        });
        if (!this.canEditSupplier()) {
          this.supplierForm.disable();
        }
      },
      error: () => this.loadingSupplier.set(false),
      complete: () => this.loadingSupplier.set(false),
    });
  }

  protected saveSupplier(): void {
    this.supplierForm.markAllAsTouched();
    if (this.supplierForm.invalid) return;

    const v = this.supplierForm.getRawValue();
    this.savingSupplier.set(true);
    this.supplierService
      .updateSettings({
        daysWithoutActiveProject: v.daysWithoutActiveProject ?? 90,
        runHour: v.runHour ?? 9,
        runMinute: v.runMinute ?? 0,
      })
      .subscribe({
        next: () => {
          this.savingSupplier.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('supplierAutoDeactivate.settings.saved'),
          });
        },
        error: () => {
          this.savingSupplier.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('supplierAutoDeactivate.settings.saveError'),
          });
        },
      });
  }
}
