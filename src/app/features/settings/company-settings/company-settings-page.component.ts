import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

import { I18nService } from '@core/i18n/i18n.service';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { CompanySettingsApiService } from '@features/service/company-settings.api.service';

/** Menu "Configurações > Empresa" - nome/CNPJ/endereço/contato exibidos no cabeçalho dos
 *  Chamados (ver TicketDetailComponent). Mesmo padrão de linha única das outras telas de
 *  Configurações desta sessão (WorkAutoCompleteSettingsComponent). */
@Component({
  standalone: true,
  selector: 'app-company-settings-page',
  templateUrl: './company-settings-page.component.html',
  imports: [
    CardModule,
    ButtonModule,
    TranslateModule,
    InputTextModule,
    FloatLabelModule,
    ReactiveFormsModule,
    PageHeaderComponent,
  ],
})
export class CompanySettingsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(MessageService);
  private readonly perms = inject(PermissionService);
  private readonly service = inject(CompanySettingsApiService);

  protected readonly saving = signal(false);
  protected readonly loading = signal(false);

  protected readonly canEdit = computed(() => this.perms.hasSupportOr(PERMISSIONS.SETTINGS.COMPANY_CHANGE));

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    document: this.fb.control<string | null>(null, [Validators.maxLength(20)]),
    addressLine: this.fb.control<string | null>(null, [Validators.maxLength(255)]),
    city: this.fb.control<string | null>(null, [Validators.maxLength(100)]),
    state: this.fb.control<string | null>(null, [Validators.maxLength(2)]),
    postalCode: this.fb.control<string | null>(null, [Validators.maxLength(20)]),
    phone: this.fb.control<string | null>(null, [Validators.maxLength(20)]),
    email: this.fb.control<string | null>(null, [Validators.maxLength(255)]),
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.service.getSettings().subscribe({
      next: (s) => {
        this.form.patchValue(s);
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
        name: v.name ?? '',
        document: v.document,
        addressLine: v.addressLine,
        city: v.city,
        state: v.state,
        postalCode: v.postalCode,
        phone: v.phone,
        email: v.email,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('companySettings.saved'),
          });
        },
        error: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('companySettings.saveError'),
          });
        },
      });
  }
}
