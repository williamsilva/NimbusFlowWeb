import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
import { GroupAdminService, GroupOption, GroupRequest, PermissionOption } from './group.service';

export interface GroupFormDialogData {
  group: GroupOption | null;
}

/**
 * Nome/descrição + permissões num dialog único (mais simples que o CardSyncWeb, que usa uma tela
 * de detalhe separada com abas Resumo/Permissões/Usuários) - salva os dois PUTs (dados do grupo +
 * PUT .../permissions) em sequência sob o mesmo botão Salvar. Sem aba de "usuários do grupo" -
 * essa associação já é feita pela tela de Usuário (groupIds), não duplicada aqui.
 */
@Component({
  selector: 'app-group-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './group-form.component.html',
  styleUrl: './group-form.component.scss',
})
export class GroupFormComponent implements OnInit {
  groupId: string | null = null;
  saving = false;
  loadingDetail = false;
  permissionOptions: PermissionOption[] = [];
  canManagePermissions = false;
  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly groupAdminService: GroupAdminService,
    private readonly authService: AuthService,
    private readonly dialogRef: MatDialogRef<GroupFormComponent>,
    private readonly snackBar: MatSnackBar,
    private readonly i18n: I18nService,
    @Inject(MAT_DIALOG_DATA) private readonly data: GroupFormDialogData,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
      description: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1204)]],
      permissionIds: this.fb.control<string[]>([]),
    });
  }

  ngOnInit(): void {
    this.authService.loadMe().subscribe((user) => {
      this.canManagePermissions = user.permissions.includes('GROUPS_MANAGEMENT_PERMISSION');
    });
    this.groupAdminService.listPermissionOptions().subscribe((options) => (this.permissionOptions = options));

    if (this.data.group) {
      this.groupId = this.data.group.id;
      this.form.patchValue({ name: this.data.group.name, description: this.data.group.description });

      this.loadingDetail = true;
      this.groupAdminService.get(this.groupId).subscribe({
        next: (detail) => {
          this.form.patchValue({ permissionIds: detail.permissions.map((p) => p.id) });
          this.loadingDetail = false;
        },
        error: () => (this.loadingDetail = false),
      });
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open(this.i18n.tUi('groups.form.reviewFields'), this.i18n.tUi('common.ok'), { duration: 4000 });
      return;
    }

    const value = this.form.getRawValue();
    const request: GroupRequest = { name: value.name!, description: value.description! };

    this.saving = true;
    const save$ = this.groupId
      ? this.groupAdminService.update(this.groupId, request)
      : this.groupAdminService.create(request);

    save$.subscribe({
      next: (saved) => {
        if (!this.canManagePermissions) {
          this.dialogRef.close(true);
          return;
        }
        this.groupAdminService.updatePermissions(saved.id, value.permissionIds ?? []).subscribe({
          next: () => this.dialogRef.close(true),
          error: (err: HttpErrorResponse) => this.handleSaveError(err),
        });
      },
      error: (err: HttpErrorResponse) => this.handleSaveError(err),
    });
  }

  private handleSaveError(err: HttpErrorResponse): void {
    this.saving = false;
    const code = err.error?.detail as string | undefined;
    const message = code
      ? this.i18n.tUi(`errors.${code}`, undefined, this.i18n.tUi('groups.form.saveError'))
      : this.i18n.tUi('groups.form.saveError');
    this.snackBar.open(message, this.i18n.tUi('common.ok'), { duration: 5000 });
  }
}
