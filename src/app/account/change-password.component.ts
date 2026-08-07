import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';

import { I18nService } from '../core/i18n/i18n.service';
import { AccountService, PasswordPolicy } from './account.service';

const KNOWN_ERROR_CODES = ['PASSWORD_CURRENT_INVALID', 'PASSWORD_POLICY_INVALID', 'NIMBUS_AUTH_ERROR'];

@Component({
    selector: 'app-change-password',
    imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslatePipe
],
    templateUrl: './change-password.component.html',
    styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
  readonly form: ReturnType<FormBuilder['group']>;

  policy: PasswordPolicy | null = null;
  loadingPolicy = true;
  saving = false;
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  private readonly checkSubject = new Subject<{ password: string; confirmPassword: string }>();
  private checkSub?: Subscription;
  private valueChangesSub?: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly accountService: AccountService,
    private readonly i18n: I18nService,
    private readonly messageService: MessageService,
    private readonly location: Location,
  ) {
    this.form = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadIdlePolicy();

    this.checkSub = this.checkSubject
      .pipe(
        debounceTime(350),
        switchMap(({ password, confirmPassword }) => this.accountService.checkPasswordPolicy(password, confirmPassword)),
      )
      .subscribe({
        next: (policy) => (this.policy = policy),
        error: () =>
          this.messageService.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('account.password.policyLoadError'),
          }),
      });

    this.valueChangesSub = this.form.valueChanges.subscribe(() => this.triggerCheck());
  }

  ngOnDestroy(): void {
    this.checkSub?.unsubscribe();
    this.valueChangesSub?.unsubscribe();
  }

  get validCount(): number {
    return this.policy?.rules.filter((r) => r.state === 'OK').length ?? 0;
  }

  get invalidCount(): number {
    return this.policy?.rules.filter((r) => r.state === 'FAIL').length ?? 0;
  }

  get totalCount(): number {
    return this.policy?.rules.length ?? 0;
  }

  get strengthPercent(): number {
    return this.totalCount ? Math.round((this.validCount / this.totalCount) * 100) : 0;
  }

  get strengthKey(): string {
    if (!this.policy || this.totalCount === 0 || this.strengthPercent === 0) {
      return 'account.password.strengthNotInformed';
    }
    if (this.strengthPercent < 50) return 'account.password.strengthWeak';
    if (this.strengthPercent < 100) return 'account.password.strengthMedium';
    return 'account.password.strengthStrong';
  }

  ruleIcon(state: string): string {
    if (state === 'OK') return 'check_circle';
    if (state === 'FAIL') return 'cancel';
    return 'remove_circle_outline';
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.messageService.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('account.password.mismatch'),
      });
      return;
    }

    this.saving = true;
    this.accountService
      .changeMyPassword({ currentPassword: currentPassword!, newPassword: newPassword!, confirmPassword: confirmPassword! })
      .subscribe({
        next: () => {
          this.saving = false;
          this.messageService.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('account.password.success'),
          });
          this.form.reset();
          this.loadIdlePolicy();
        },
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi(this.errorKeyFor(err)),
          });
        },
      });
  }

  goBack(): void {
    this.location.back();
  }

  private errorKeyFor(err: HttpErrorResponse): string {
    // ResponseStatusException com spring.mvc.problemdetails.enabled=true devolve o "reason" no
    // campo "detail" de um corpo RFC 7807 (application/problem+json).
    const code = err.error?.detail;
    return code && KNOWN_ERROR_CODES.includes(code) ? `errors.${code}` : 'errors.GENERIC';
  }

  private loadIdlePolicy(): void {
    this.loadingPolicy = true;
    this.accountService.getPasswordPolicy().subscribe({
      next: (policy) => {
        this.policy = policy;
        this.loadingPolicy = false;
      },
      error: () => {
        this.loadingPolicy = false;
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('account.password.policyLoadError'),
        });
      },
    });
  }

  private triggerCheck(): void {
    const newPassword = this.form.value.newPassword || '';
    const confirmPassword = this.form.value.confirmPassword || '';
    if (!newPassword) {
      this.loadIdlePolicy();
      return;
    }
    this.checkSubject.next({ password: newPassword, confirmPassword });
  }
}
