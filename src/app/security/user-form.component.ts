import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';

import { I18nService } from '../core/i18n/i18n.service';
import { formatTaxId, onlyDigits } from '../shared/utils/br-format';
import { GroupAdminService, GroupRef } from './group.service';
import { AdminUser, AdminUserRequest, UserAdminService } from './user.service';

export interface UserFormDialogData {
  user: AdminUser | null;
}

/** Documento de pessoa física (usuário) - só CPF, ao contrário de suppliers.taxIdValidator (que
 *  aceita CPF ou CNPJ, fornecedor pode ser PJ). */
function cpfValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const digits = onlyDigits(control.value);
    if (!digits) {
      return null; // required cuida do caso vazio
    }
    return digits.length === 11 ? null : { cpf: true };
  };
}

/**
 * Sem campo de senha - o cadastro de usuário no NimbusFlow (via NimbusAuth) é por convite: ao
 * criar, o próprio usuário recebe um e-mail pra definir a senha (userName = e-mail = login); ver
 * users.list.resendInvite na listagem pra reenviar caso o convite expire/se perca.
 */
@Component({
    selector: 'app-user-form',
    imports: [ReactiveFormsModule, ButtonModule, FloatLabelModule, InputTextModule, MultiSelectModule, TranslatePipe],
    templateUrl: './user-form.component.html',
    styleUrl: './user-form.component.scss'
})
export class UserFormComponent implements OnInit {
  userId: string | null = null;
  saving = false;
  groupOptions: GroupRef[] = [];
  form;

  private readonly data: UserFormDialogData;

  constructor(
    private readonly fb: FormBuilder,
    private readonly userAdminService: UserAdminService,
    private readonly groupAdminService: GroupAdminService,
    private readonly dialogRef: DynamicDialogRef,
    private readonly messageService: MessageService,
    private readonly i18n: I18nService,
    config: DynamicDialogConfig<UserFormDialogData>,
  ) {
    this.data = config.data!;
    this.form = this.fb.group({
      name: ['', Validators.required],
      userName: ['', [Validators.required, Validators.email]],
      document: ['', [Validators.required, cpfValidator()]],
      groupIds: this.fb.control<string[]>([], [Validators.required, Validators.minLength(1)]),
    });
  }

  ngOnInit(): void {
    this.groupAdminService.list().subscribe((groups) => (this.groupOptions = groups));

    if (this.data.user) {
      this.userId = this.data.user.id;
      this.form.patchValue({
        name: this.data.user.name,
        userName: this.data.user.userName,
        document: formatTaxId(this.data.user.document),
        groupIds: this.data.user.groups.map((g) => g.id),
      });
    }
  }

  /** Aplica a máscara de CPF enquanto o usuário digita. */
  onDocumentInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatTaxId(input.value);
    input.value = formatted;
    this.form.controls.document.setValue(formatted, { emitEvent: false });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('users.form.reviewFields'),
      });
      return;
    }

    const value = this.form.getRawValue();
    const request: AdminUserRequest = {
      userName: value.userName!,
      name: value.name!,
      document: onlyDigits(value.document),
      groupIds: value.groupIds ?? [],
    };

    this.saving = true;
    const request$ = this.userId
      ? this.userAdminService.update(this.userId, request)
      : this.userAdminService.create(request);

    request$.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: this.i18n.tUi('common.error'), detail: this.errorMessage(err) });
      },
    });
  }

  /** "code" do NimbusAuth repassado como reason do ResponseStatusException pelo backend (ver
   *  NimbusAuthAdminClient.mapUpstreamError) - traduzido via errors.<code>, com fallback genérico. */
  private errorMessage(err: HttpErrorResponse): string {
    const code = err.error?.detail as string | undefined;
    if (code) {
      return this.i18n.tUi(`errors.${code}`, undefined, this.i18n.tUi('users.form.saveError'));
    }
    return this.i18n.tUi('users.form.saveError');
  }
}
