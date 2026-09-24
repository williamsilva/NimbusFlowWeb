import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';

import { I18nService } from '@core/i18n/i18n.service';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TaskShiftSettingsApiService } from '@features/service/task-shift-settings.api.service';

function timeStringToDate(value: string): Date {
  const [h, m] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date;
}

function dateToTimeString(value: Date): string {
  const h = String(value.getHours()).padStart(2, '0');
  const m = String(value.getMinutes()).padStart(2, '0');
  return `${h}:${m}:00`;
}

/** Página "Configurações > Turnos" (pedido do usuário 2026-09-24) - horário de início/fim de cada
 *  um dos 3 Turnos fixos (Manhã/Tarde/Noite, ver TaskShiftEnum), consumido por
 *  TaskService#isReleased no backend pra só mostrar uma Tarefa com Turno definido dentro dessa
 *  janela, no dia do vencimento. Página dedicada, não uma aba de WorkAutoCompleteSettingsComponent
 *  (domínio diferente) nem de "Locais" (Locais é uma lista/CRUD, isto é um form único) - mesmo
 *  padrão de linha única de TaskRecurrenceSettingsApiService, só que com 6 campos em vez de 1. */
@Component({
  standalone: true,
  selector: 'app-task-shift-settings',
  templateUrl: './task-shift-settings.component.html',
  imports: [
    ButtonModule,
    TooltipModule,
    TranslateModule,
    FloatLabelModule,
    DatePickerModule,
    ReactiveFormsModule,
    PageHeaderComponent,
  ],
})
export class TaskShiftSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly perms = inject(PermissionService);
  private readonly api = inject(TaskShiftSettingsApiService);

  readonly i18n = inject(I18nService);

  readonly canView = computed(() => this.perms.hasSupportOr(PERMISSIONS.SETTINGS.TASK_SHIFT_SETTINGS_VIEW));
  readonly canEdit = computed(() => this.perms.hasSupportOr(PERMISSIONS.SETTINGS.TASK_SHIFT_SETTINGS_CHANGE));

  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    morningStart: [timeStringToDate('06:00:00'), Validators.required],
    morningEnd: [timeStringToDate('12:00:00'), Validators.required],
    afternoonStart: [timeStringToDate('12:00:00'), Validators.required],
    afternoonEnd: [timeStringToDate('18:00:00'), Validators.required],
    eveningStart: [timeStringToDate('18:00:00'), Validators.required],
    eveningEnd: [timeStringToDate('22:00:00'), Validators.required],
  });

  constructor() {
    if (this.canView()) {
      this.load();
    }
  }

  private load(): void {
    this.loading.set(true);
    this.api.getSettings().subscribe({
      next: (s) => {
        this.form.patchValue({
          morningStart: timeStringToDate(s.morningStart),
          morningEnd: timeStringToDate(s.morningEnd),
          afternoonStart: timeStringToDate(s.afternoonStart),
          afternoonEnd: timeStringToDate(s.afternoonEnd),
          eveningStart: timeStringToDate(s.eveningStart),
          eveningEnd: timeStringToDate(s.eveningEnd),
        });
        if (!this.canEdit()) {
          this.form.disable();
        }
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .updateSettings({
        morningStart: dateToTimeString(v.morningStart!),
        morningEnd: dateToTimeString(v.morningEnd!),
        afternoonStart: dateToTimeString(v.afternoonStart!),
        afternoonEnd: dateToTimeString(v.afternoonEnd!),
        eveningStart: dateToTimeString(v.eveningStart!),
        eveningEnd: dateToTimeString(v.eveningEnd!),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('taskShiftSettings.saved'),
          });
        },
        error: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('taskShiftSettings.saveError'),
          });
        },
      });
  }
}
