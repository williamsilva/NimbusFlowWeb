import { RouterModule } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  inject,
  signal,
  effect,
  computed,
  Component,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  Validators,
  FormBuilder,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';

import { merge } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';

import { MeStore } from '@core/auth/me.store';
import { I18nService } from '@core/i18n/i18n.service';
import { CsTagComponent, CsTagTone } from '@shared/ui';
import { ApiError } from '@core/errors/api-error.model';
import { ToastService } from '@core/toast/toast.service';
import { applyApiFieldErrors } from '@core/errors/form-errors.util';
import { ErrorMapperService } from '@core/errors/error-mapper.service';
import { CsBadgeComponent } from '@shared/ui/badge/cs-badge.component';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { AccountPasswordService, PasswordRulesViewModel } from './account-password.service';

function passwordMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const newPasswordControl = group.get('newPassword');
    const confirmPasswordControl = group.get('confirmPassword');

    const newPassword = newPasswordControl?.value ?? '';
    const confirmPassword = confirmPasswordControl?.value ?? '';

    if (!confirmPasswordControl) return null;

    const currentErrors = confirmPasswordControl.errors ?? {};
    const { passwordMismatch: _passwordMismatch, ...otherErrors } = currentErrors;

    if (!newPassword || !confirmPassword) {
      confirmPasswordControl.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
      return null;
    }

    if (newPassword !== confirmPassword) {
      confirmPasswordControl.setErrors({
        ...otherErrors,
        passwordMismatch: true,
      });
      return { passwordMismatch: true };
    }

    confirmPasswordControl.setErrors(Object.keys(otherErrors).length ? otherErrors : null);
    return null;
  };
}

type PolicyRuleState = 'idle' | 'valid' | 'invalid';
type PasswordStrengthLevel = 'empty' | 'weak' | 'medium' | 'strong';

type PolicyRuleVm = {
  code: string;
  message: string;
  state: PolicyRuleState;
};

@Component({
  standalone: true,
  selector: 'cs-account-password-page',
  styleUrl: './account-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-password.component.html',
  imports: [
    CommonModule,
    CardModule,
    RouterModule,
    ButtonModule,
    TooltipModule,
    DividerModule,
    PasswordModule,
    CsTagComponent,
    TranslateModule,
    CsBadgeComponent,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
    ProgressSpinnerModule,
  ],
})
export class AccountPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly meStore = inject(MeStore);
  private readonly location = inject(Location);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mapper = inject(ErrorMapperService);
  private readonly service = inject(AccountPasswordService);

  readonly saving = signal(false);
  readonly i18n = inject(I18nService);
  readonly loadingPolicy = signal(false);
  readonly loadingInitialPolicy = signal(true);
  readonly bannerError = signal<string | null>(null);

  readonly minLen = signal<number | null>(null);
  readonly policyRules = signal<PolicyRuleVm[]>([]);

  readonly me = computed(() => this.meStore.me());

  readonly displayName = computed(() => {
    const me = this.me();
    return (
      me?.name?.trim() || me?.username?.trim() || this.i18n.tUi('accountPassword.userFallback')
    );
  });

  readonly displayUsername = computed(() => {
    const me = this.me();
    return me?.username?.trim() || this.i18n.tUi('accountPassword.usernameFallback');
  });

  readonly validRulesCount = computed(
    () => this.policyRules().filter((rule) => rule.state === 'valid').length,
  );

  readonly invalidRulesCount = computed(
    () => this.policyRules().filter((rule) => rule.state === 'invalid').length,
  );

  readonly totalRulesCount = computed(() => this.policyRules().length);

  readonly passwordStrengthPercent = computed(() => {
    const total = this.totalRulesCount();
    if (!total) return 0;

    const valid = this.validRulesCount();
    return Math.round((valid / total) * 100);
  });

  readonly passwordStrengthLevel = computed<PasswordStrengthLevel>(() => {
    const password = this.form.controls.newPassword.value?.trim() ?? '';
    const percent = this.passwordStrengthPercent();

    if (!password) return 'empty';
    if (percent <= 33) return 'weak';
    if (percent <= 66) return 'medium';
    return 'strong';
  });

  readonly strengthBadgeSeverity = computed<CsTagTone>(() => {
    switch (this.passwordStrengthLevel()) {
      case 'weak':
        return 'warn';
      case 'medium':
        return 'info';
      case 'strong':
        return 'success';
      case 'empty':
      default:
        return 'contrast';
    }
  });

  readonly form = this.fb.group(
    {
      newPassword: ['', [Validators.required]],
      currentPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordMatchValidator()] },
  );

  readonly passwordMismatch = computed(() => {
    const confirm = this.form.controls.confirmPassword;
    return !!confirm.errors?.['passwordMismatch'] && (confirm.touched || confirm.dirty);
  });

  readonly canSubmit = computed(() => {
    const formValid = this.form.valid;
    const notSaving = !this.saving();
    const notLoadingPolicy = !this.loadingPolicy() && !this.loadingInitialPolicy();
    const hasInvalidRule = this.policyRules().some((rule) => rule.state === 'invalid');

    return formValid && notSaving && notLoadingPolicy && !hasInvalidRule;
  });

  constructor() {
    effect(() => {
      const password = this.form.controls.newPassword.value?.trim() ?? '';

      if (password) {
        this.validatePolicyLive();
      } else {
        this.loadInitialPolicy();
      }
    });

    this.form.controls.currentPassword.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.bannerError.set(null);
        this.clearApiError(this.form.controls.currentPassword);
      });

    this.form.controls.newPassword.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.bannerError.set(null);
        this.clearApiError(this.form.controls.newPassword);
      });

    this.form.controls.confirmPassword.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.bannerError.set(null);
        this.clearApiError(this.form.controls.confirmPassword);
      });

    merge(
      this.form.controls.currentPassword.valueChanges,
      this.form.controls.newPassword.valueChanges,
      this.form.controls.confirmPassword.valueChanges,
    )
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.validatePolicyLive();
      });
  }

  back(): void {
    this.location.back();
  }

  submit(): void {
    this.bannerError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.saving.set(true);

    this.service
      .changeMyPassword({
        currentPassword: raw.currentPassword ?? '',
        newPassword: raw.newPassword ?? '',
        confirmPassword: raw.confirmPassword ?? '',
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.toast.success(
            this.i18n.tUi('accountPassword.successTitle'),
            this.i18n.tUi('accountPassword.successMessage'),
          );

          this.form.reset({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });

          this.form.markAsPristine();
          this.form.markAsUntouched();
          this.resetToIdlePolicy();
        },
        error: (err) => {
          const apiError = this.mapper.normalize(err) as ApiError;
          const applied = applyApiFieldErrors(this.form, apiError);

          if (!applied) {
            this.bannerError.set(this.mapper.message(apiError));
          }
        },
      });
  }

  onPasswordFieldBlur(): void {
    this.validatePolicyLive();
  }

  initials(value?: string | null): string {
    const text = (value || '').trim();
    if (!text) return '?';

    const parts = text.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  policySummarySeverity(): CsTagTone {
    if (this.invalidRulesCount() > 0) return 'danger';
    if (this.validRulesCount() > 0) return 'success';
    return 'contrast';
  }

  private applyPolicyResponse(res: PasswordRulesViewModel, mode: 'idle' | 'checked'): void {
    this.minLen.set(res.minLen ?? null);

    const rules = (res.rules ?? []).map((rule) => ({
      code: rule.code,
      message: rule.label || rule.code,
      state: this.mapRuleState(rule.state, mode),
    })) satisfies PolicyRuleVm[];

    this.policyRules.set(rules);
  }

  private mapRuleState(
    serverState: string | null | undefined,
    mode: 'idle' | 'checked',
  ): PolicyRuleState {
    if (mode === 'idle') {
      return 'idle';
    }

    switch (serverState) {
      case 'OK':
        return 'valid';
      case 'FAIL':
        return 'invalid';
      case 'PENDING':
      default:
        return 'idle';
    }
  }

  private clearApiError(control: AbstractControl | null): void {
    if (!control?.errors?.['api']) return;

    const { api: _api, ...rest } = control.errors ?? {};
    control.setErrors(Object.keys(rest).length ? rest : null);
  }

  private validatePolicyLive(): void {
    const password = this.form.controls.newPassword.value?.trim() ?? '';
    const confirmPassword = this.form.controls.confirmPassword.value?.trim() ?? '';
    const username = this.meStore.me()?.username ?? null;

    if (!password) {
      this.resetToIdlePolicy();
      return;
    }

    this.loadingPolicy.set(true);

    this.service
      .checkPolicy({
        password,
        confirmPassword: confirmPassword || null,
        username,
      })
      .pipe(finalize(() => this.loadingPolicy.set(false)))
      .subscribe({
        next: (res) => {
          this.applyPolicyResponse(res, 'checked');
        },
        error: () => {
          this.loadingPolicy.set(false);
        },
      });
  }

  private loadInitialPolicy(): void {
    this.loadingInitialPolicy.set(true);

    this.service
      .loadPolicy()
      .pipe(finalize(() => this.loadingInitialPolicy.set(false)))
      .subscribe({
        next: (res) => this.applyPolicyResponse(res, 'idle'),
        error: () => {
          this.policyRules.set([]);
        },
      });
  }

  private resetToIdlePolicy(): void {
    this.service.loadPolicy().subscribe({
      next: (res) => this.applyPolicyResponse(res, 'idle'),
      error: () => undefined,
    });
  }
}
