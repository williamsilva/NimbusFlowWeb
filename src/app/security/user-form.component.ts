import { HttpErrorResponse } from '@angular/common/http';
import { computed, effect, inject, input, output, signal, Component } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';

import { I18nService } from '../core/i18n/i18n.service';
import { formatTaxId, onlyDigits } from '../shared/utils/br-format';
import { GroupAdminService, GroupRef } from './group.service';
import { AdminUser, AdminUserRequest, UserAdminService } from './user.service';

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
 * Diálogo embutido via [visible]/(visibleChange) - mesmo padrão do CardSyncWeb (users-create-
 * dialog.component.ts), em vez do DialogService/DynamicDialogRef imperativo usado antes aqui.
 *
 * Sem campo de senha - o cadastro de usuário no NimbusFlow (via NimbusAuth) é por convite: ao
 * criar, o próprio usuário recebe um e-mail pra definir a senha (userName = e-mail = login); ver
 * users.list.resendInvite na listagem pra reenviar caso o convite expire/se perca.
 */
@Component({
  standalone: true,
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    FloatLabelModule,
    InputTextModule,
    MultiSelectModule,
    TranslatePipe,
  ],
})
export class UserFormComponent {
  visible = input.required<boolean>();
  user = input<AdminUser | null>(null);

  visibleChange = output<boolean>();
  saved = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly userAdminService = inject(UserAdminService);
  private readonly groupAdminService = inject(GroupAdminService);
  private readonly messageService = inject(MessageService);
  private readonly i18n = inject(I18nService);

  readonly isEditMode = computed(() => !!this.user());
  readonly saving = signal(false);
  readonly groupOptions = signal<GroupRef[]>([]);

  private lastLoadedId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    userName: ['', [Validators.required, Validators.email]],
    document: ['', [Validators.required, cpfValidator()]],
    groupIds: this.fb.nonNullable.control<string[]>([], [Validators.required, Validators.minLength(1)]),
  });

  constructor() {
    this.groupAdminService.list().subscribe((groups) => this.groupOptions.set(groups));

    effect(() => {
      if (!this.visible()) return;

      const user = this.user();
      if (!user) {
        this.lastLoadedId = null;
        this.resetFormForCreate();
        return;
      }

      if (this.lastLoadedId === user.id) return;
      this.lastLoadedId = user.id;

      this.form.reset({
        name: user.name,
        userName: user.userName,
        document: formatTaxId(user.document),
        groupIds: user.groups.map((g) => g.id),
      });
    });
  }

  /** Aplica a máscara de CPF enquanto o usuário digita. */
  onDocumentInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatTaxId(input.value);
    input.value = formatted;
    this.form.controls.document.setValue(formatted, { emitEvent: false });
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
      userName: value.userName,
      name: value.name,
      document: onlyDigits(value.document),
      groupIds: value.groupIds,
    };

    this.saving.set(true);
    const id = this.user()?.id;
    const request$ = id ? this.userAdminService.update(id, request) : this.userAdminService.create(request);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
        this.close();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: this.i18n.tUi('common.error'), detail: this.errorMessage(err) });
      },
    });
  }

  private resetFormForCreate(): void {
    this.form.reset({ name: '', userName: '', document: '', groupIds: [] });
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
