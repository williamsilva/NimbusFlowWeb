import { HttpErrorResponse } from '@angular/common/http';
import { computed, effect, inject, input, output, signal, Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

import { I18nService } from '../core/i18n/i18n.service';
import { GroupAdminService, GroupRef, GroupRequest } from './group.service';

/**
 * Diálogo embutido via [visible]/(visibleChange) - mesmo padrão do CardSyncWeb (groups-create-
 * dialog.component.ts): só nome/descrição. Permissões não são mais editadas por aqui - isso ficou
 * pra aba "Permissões" da tela de Detalhe do Grupo (ver group-detail.component.ts), igual ao
 * CardSyncWeb. Sem aba/gestão de "usuários do grupo" - essa associação continua sendo feita pela
 * tela de Usuário (groupIds), decisão de propósito do NimbusFlow (não duplicada aqui).
 */
@Component({
  standalone: true,
  selector: 'app-group-form',
  templateUrl: './group-form.component.html',
  styleUrl: './group-form.component.scss',
  imports: [ReactiveFormsModule, ButtonModule, DialogModule, FloatLabelModule, InputTextModule, TranslatePipe],
})
export class GroupFormComponent {
  visible = input.required<boolean>();
  group = input<GroupRef | null>(null);

  visibleChange = output<boolean>();
  saved = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly groupAdminService = inject(GroupAdminService);
  private readonly messageService = inject(MessageService);
  private readonly i18n = inject(I18nService);

  readonly isEditMode = computed(() => !!this.group());
  readonly saving = signal(false);

  private lastLoadedId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1204)]],
  });

  constructor() {
    effect(() => {
      if (!this.visible()) return;

      const group = this.group();
      if (!group) {
        this.lastLoadedId = null;
        this.resetFormForCreate();
        return;
      }

      if (this.lastLoadedId === group.id) return;
      this.lastLoadedId = group.id;

      this.form.reset({ name: group.name, description: group.description });
    });
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
        detail: this.i18n.tUi('groups.form.reviewFields'),
      });
      return;
    }

    const value = this.form.getRawValue();
    const request: GroupRequest = { name: value.name, description: value.description };

    this.saving.set(true);
    const id = this.group()?.id;
    const save$ = id ? this.groupAdminService.update(id, request) : this.groupAdminService.create(request);

    save$.subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
        this.close();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const code = err.error?.detail as string | undefined;
        const message = code
          ? this.i18n.tUi(`errors.${code}`, undefined, this.i18n.tUi('groups.form.saveError'))
          : this.i18n.tUi('groups.form.saveError');
        this.messageService.add({ severity: 'error', summary: this.i18n.tUi('common.error'), detail: message });
      },
    });
  }

  private resetFormForCreate(): void {
    this.form.reset({ name: '', description: '' });
  }
}
