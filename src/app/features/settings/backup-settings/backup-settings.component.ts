import { FormsModule } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';

import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { BackupApiService, BackupTarget } from '@features/service/backup.api.service';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';

@Component({
  standalone: true,
  selector: 'cs-backup-settings',
  templateUrl: './backup-settings.component.html',
  imports: [
    CardModule,
    FormsModule,
    ButtonModule,
    TooltipModule,
    CheckboxModule,
    TranslateModule,
    PageHeaderComponent,
  ],
})
export class BackupSettingsComponent {
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(MessageService);
  private readonly perms = inject(PermissionService);
  private readonly service = inject(BackupApiService);

  protected readonly running = signal(false);

  protected readonly canExecute = computed(() =>
    this.perms.hasSupportOr(PERMISSIONS.SETTINGS.BACKUP_PROCESS),
  );

  protected selectedTargets: BackupTarget[] = [];

  protected execute(): void {
    if (this.selectedTargets.length === 0) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('backup.settings.noSelection'),
      });
      return;
    }

    this.running.set(true);
    this.service.execute(this.selectedTargets).subscribe({
      next: (response) => {
        this.running.set(false);
        this.downloadBlob(response);
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi('backup.settings.executed'),
        });
      },
      error: () => {
        this.running.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('backup.settings.executeError'),
        });
      },
    });
  }

  private downloadBlob(response: HttpResponse<Blob>): void {
    const blob = response.body;
    if (!blob) return;

    const contentDisposition = response.headers.get('Content-Disposition') ?? '';
    const filenameMatch = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(contentDisposition);
    const filename = filenameMatch?.[1] ?? 'backup_nb.zip';

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
