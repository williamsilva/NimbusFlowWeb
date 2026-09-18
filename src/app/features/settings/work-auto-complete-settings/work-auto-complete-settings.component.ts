import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';

import { I18nService } from '@core/i18n/i18n.service';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { WorkAutoCompleteSettingsApiService } from '@features/service/work-auto-complete-settings.api.service';
import { ProjectAutoCompleteSettingsApiService } from '@features/service/project-auto-complete-settings.api.service';
import { SupplierAutoDeactivateSettingsApiService } from '@features/service/supplier-auto-deactivate-settings.api.service';

/** Página "Configurações > Conclusão Automática" - 1 aba por job (Frente de Serviço, Projeto,
 *  Fornecedor), cada uma com sua própria carência/horário/permissão (decisão do usuário
 *  2026-09-18: mesma tela, blocos separados; reorganizado em abas + seletor de horário em
 *  2026-09-19 a pedido do usuário, mesmo padrão de abas de BackupPageComponent no NimbusCoreWeb). */
@Component({
  standalone: true,
  selector: 'app-work-auto-complete-settings',
  templateUrl: './work-auto-complete-settings.component.html',
  imports: [
    CardModule,
    TabsModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    FloatLabelModule,
    DatePickerModule,
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
    runTime: [this.timeOf(8, 0), Validators.required],
  });

  readonly projectForm = this.fb.group({
    daysSinceLastPayment: [5, [Validators.required, Validators.min(0), Validators.max(365)]],
    runTime: [this.timeOf(8, 30), Validators.required],
  });

  readonly supplierForm = this.fb.group({
    daysWithoutActiveProject: [90, [Validators.required, Validators.min(0), Validators.max(3650)]],
    runTime: [this.timeOf(9, 0), Validators.required],
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

  /** Aba padrão: a primeira, entre Frente/Projeto/Fornecedor, que o usuário de fato tem permissão
   *  de ver - mesmo racional de WorksDetailComponent.defaultTab(). */
  protected defaultTab(): string {
    if (this.canViewWork()) return 'work';
    if (this.canViewProject()) return 'project';
    if (this.canViewSupplier()) return 'supplier';
    return 'work';
  }

  private timeOf(hour: number, minute: number): Date {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  protected loadWork(): void {
    this.loadingWork.set(true);
    this.workService.getSettings().subscribe({
      next: (s) => {
        this.workForm.patchValue({
          daysSinceLastPayment: s.daysSinceLastPayment,
          runTime: this.timeOf(s.runHour, s.runMinute),
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
    const runTime = v.runTime ?? this.timeOf(8, 0);
    this.savingWork.set(true);
    this.workService
      .updateSettings({
        daysSinceLastPayment: v.daysSinceLastPayment ?? 5,
        runHour: runTime.getHours(),
        runMinute: runTime.getMinutes(),
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
          runTime: this.timeOf(s.runHour, s.runMinute),
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
    const runTime = v.runTime ?? this.timeOf(8, 30);
    this.savingProject.set(true);
    this.projectService
      .updateSettings({
        daysSinceLastPayment: v.daysSinceLastPayment ?? 5,
        runHour: runTime.getHours(),
        runMinute: runTime.getMinutes(),
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
          runTime: this.timeOf(s.runHour, s.runMinute),
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
    const runTime = v.runTime ?? this.timeOf(9, 0);
    this.savingSupplier.set(true);
    this.supplierService
      .updateSettings({
        daysWithoutActiveProject: v.daysWithoutActiveProject ?? 90,
        runHour: runTime.getHours(),
        runMinute: runTime.getMinutes(),
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
