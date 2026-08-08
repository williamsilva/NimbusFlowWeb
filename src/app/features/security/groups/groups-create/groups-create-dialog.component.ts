
import { computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { input, signal, Output, inject, Component, EventEmitter, effect } from '@angular/core';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { GroupsFacade } from '@features/facade/groups.facade';
import { GroupCreateInput, GroupModel } from '@models/groups.models';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { GroupsPermissionPolicy } from '@features/security/policy/groups-permission.policy';

@Component({
  standalone: true,
  selector: 'app-groups-create-dialog',
  templateUrl: './groups-create-dialog.component.html',
  imports: [
    ToastModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TranslateModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule
],
})
export class GroupsCreateDialogComponent {
  visible = input.required<boolean>();
  group = input<GroupModel | null>(null);

  @Output() saved = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly groups = inject(GroupsFacade);
  readonly secPolicy = inject(GroupsPermissionPolicy);

  readonly loadedGroup = signal<GroupModel | null>(null);
  readonly isEditMode = computed(() => !!this.group());

  readonly canSubmit = computed(() =>
    this.isEditMode()
      ? this.secPolicy.canEdit({
          id: this.group()?.id ?? '',
          name: this.form.controls.name.value ?? '',
        })
      : this.secPolicy.canCreate(),
  );

  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly loadingGroup = signal(false);

  private lastLoadedId: string | null = null;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    description: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
  });

  constructor() {
    effect(() => {
      if (!this.visible()) {
        return;
      }

      const group = this.group();

      if (!group) {
        this.lastLoadedId = null;
        this.resetFormForCreate();
        return;
      }

      if (this.lastLoadedId === group.id) {
        return;
      }

      this.lastLoadedId = group.id;
      this.loadingGroup.set(true);

      this.loadedGroup.set(group);
      this.form.reset({
        name: group?.name ?? '',
        description: group?.description ?? '',
      });
      this.submitted.set(false);
      this.loadingGroup.set(false);
    });
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.loadedGroup.set(null);
    this.submitted.set(false);
    this.saving.set(false);
    this.loadingGroup.set(false);
    this.lastLoadedId = null;
    this.resetFormForCreate();
    this.visibleChange.emit(false);
  }

  private resetFormForCreate(): void {
    this.loadedGroup.set(null);
    this.form.reset({
      name: '',
      description: '',
    });
  }

  save(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.focusFirstInvalid();
      return;
    }

    const v = this.form.getRawValue();

    const payload: GroupCreateInput = {
      name: v.name.trim(),
      description: v.description.trim(),
    };

    this.saving.set(true);

    const id = this.group()?.id;
    const req$ = id ? this.groups.update(id, payload) : this.groups.create(payload);

    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);

        const isEdit = !!id;

        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: isEdit
            ? this.i18n.tUi('groups.form.updated')
            : this.i18n.tUi('groups.form.created'),
        });

        if (isEdit) {
          this.updated.emit();
        } else {
          this.created.emit();
        }

        this.saved.emit();
        this.close();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  private focusFirstInvalid(): void {
    const firstInvalidName = Object.keys(this.form.controls).find(
      (key) => this.form.controls[key as keyof typeof this.form.controls].invalid,
    );

    if (!firstInvalidName) {
      return;
    }

    const el =
      document.getElementById(firstInvalidName) ||
      document.querySelector<HTMLElement>(`[inputId="${firstInvalidName}"]`) ||
      document.querySelector<HTMLElement>(`[formcontrolname="${firstInvalidName}"]`);

    if (!el) {
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const focusTarget =
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
        ? el
        : ((el.querySelector('input,textarea,[tabindex],button') as HTMLElement | null) ?? el);

    setTimeout(() => focusTarget.focus(), 80);
  }
}
