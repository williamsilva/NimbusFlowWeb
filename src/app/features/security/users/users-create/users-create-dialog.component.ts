
import { computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { input, effect, signal, Output, inject, Component, EventEmitter } from '@angular/core';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';

import { I18nService } from '@core/i18n/i18n.service';
import { UsersFacade } from '@features/facade/users.facade';
import { GroupsFacade } from '@features/facade/groups.facade';
import { UserCreateInput, UserModel } from '@models/users.models';
import { isPendingPassword } from '@models/enums/user-status.enum';
import { cpfCnpjValidator } from '@shared/validators/cpf-cnpj.validator';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { CpfCnpjMaskDirective } from '@shared/directives/cpf-cnpj-mask.directive';

@Component({
  standalone: true,
  selector: 'app-users-create-dialog',
  templateUrl: './users-create-dialog.component.html',
  imports: [
    ToastModule,
    DialogModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    TranslateModule,
    FloatLabelModule,
    ErrorMsgComponent,
    MultiSelectModule,
    ReactiveFormsModule,
    CpfCnpjMaskDirective
],
})
export class UsersCreateDialogComponent {
  visible = input.required<boolean>();
  user = input<UserModel | null>(null);

  @Output() saved = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly groups = inject(GroupsFacade);
  readonly sendingInvite = signal(false);
  readonly usersFacade = inject(UsersFacade);
  readonly loadedUser = signal<UserModel | null>(null);

  readonly isEditMode = computed(() => !!this.user());

  readonly saving = signal(false);
  readonly submitted = signal(false);

  readonly loadingUser = signal(false);
  private lastLoadedId: string | null = null;
  readonly groupOptions = this.groups.options;

  readonly form = this.fb.nonNullable.group({
    document: ['', [Validators.required, cpfCnpjValidator()]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    userName: [
      '',
      [Validators.required, Validators.email, Validators.minLength(3), Validators.maxLength(255)],
    ],
    groupIds: this.fb.nonNullable.control<string[]>(
      [],
      [Validators.required, Validators.minLength(1)],
    ),
  });

  readonly canResendInvite = computed(() => {
    if (!this.isEditMode()) return false;
    const u = this.loadedUser();
    if (!u) return false;
    return isPendingPassword(u.status);
  });

  constructor() {
    this.groups.loadGroupOptions();

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

      this.loadedUser.set(user);
      this.loadingUser.set(true);

      const digitsDoc = String(user?.document ?? '').replace(/\D+/g, '');
      const groupsRaw = Array.isArray(user?.groups) ? (user.groups as any[]) : [];

      // AdminUserResponse.groups só traz grupos do NimbusFlow (o backend já filtra por appKey e
      // funde com os grupos de outros apps no update - ver AdminUserService.update no
      // NimbusFlowServer), então não há nada pra separar aqui.
      const nimbusflowGroupIds = groupsRaw
        .map((g) => (typeof g === 'string' ? g : g?.id))
        .filter(Boolean);

      this.form.reset({
        name: user?.name ?? '',
        userName: user?.userName ?? '',
        document: digitsDoc,
        groupIds: nimbusflowGroupIds,
      });

      this.submitted.set(false);
      this.loadingUser.set(false);
    });
  }

  onResendInvite() {
    const id = this.user()?.id;
    if (!id) return;
    if (!this.canResendInvite()) return;

    this.sendingInvite.set(true);

    this.usersFacade
      .resendInvite(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('users.invite.resent'),
          });
        },
        error: () => {
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('users.invite.resendError'),
          });
        },
        complete: () => this.sendingInvite.set(false),
      });
  }

  onHide() {
    this.close();
  }

  close() {
    this.loadedUser.set(null);
    this.submitted.set(false);
    this.saving.set(false);
    this.loadingUser.set(false);
    this.lastLoadedId = null;
    this.resetFormForCreate();
    this.visibleChange.emit(false);
  }

  save() {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }

    const v = this.form.getRawValue();
    const payload: UserCreateInput = {
      name: v.name.trim(),
      userName: (v.userName ?? '').trim().toLowerCase(),
      document: String(v.document ?? '').replace(/\D+/g, ''),
      groupIds: v.groupIds?.length ? v.groupIds : undefined,
    };

    this.saving.set(true);

    const id = this.user()?.id;
    const req$ = id ? this.usersFacade.update(id, payload) : this.usersFacade.create(payload);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);

        const isEdit = !!id;
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: isEdit
            ? this.i18n.tUi('users.form.updated')
            : this.i18n.tUi('users.form.created'),
        });

        if (isEdit) this.updated.emit();
        else this.created.emit();

        this.saved.emit();
        this.close();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  private focusFirstInvalid() {
    const firstInvalidName = Object.keys(this.form.controls).find(
      (key) => this.form.controls[key as keyof typeof this.form.controls].invalid,
    );
    if (!firstInvalidName) return;

    const el =
      document.getElementById(firstInvalidName) ||
      document.querySelector<HTMLElement>(`[inputId="${firstInvalidName}"]`) ||
      document.querySelector<HTMLElement>(`[formcontrolname="${firstInvalidName}"]`);

    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const focusTarget =
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
        ? el
        : ((el.querySelector('input,textarea,[tabindex],button') as HTMLElement | null) ?? el);

    setTimeout(() => focusTarget.focus(), 80);
  }

  private resetFormForCreate() {
    this.loadedUser.set(null);
    this.form.reset({
      name: '',
      userName: '',
      document: '',
      groupIds: [],
    });
  }
}
