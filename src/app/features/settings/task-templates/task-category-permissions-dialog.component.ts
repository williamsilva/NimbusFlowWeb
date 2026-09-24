import { DestroyRef, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Output, Component, EventEmitter } from '@angular/core';

import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { FloatLabelModule } from 'primeng/floatlabel';

import { I18nService } from '@core/i18n/i18n.service';
import { UserOptionModel } from '@models/groups.models';
import { UsersApiService } from '@features/service/users.api.service';
import { DepartmentsFacade } from '@features/facade/departments.facade';
import { CargosFacade } from '@features/facade/cargos.facade';
import { TaskCategoryModel } from '@models/task-templates.models';
import { TasksTemplatesApiService } from '@features/service/tasks-templates.api.service';

/**
 * "Gerenciar permissões" de uma Categoria (pedido do usuário 2026-09-24, print de referência) -
 * define quem pode ver a categoria/seus modelos/suas tarefas via Departamento/Cargo/Colaborador.
 * Os 3 conjuntos vazios = visível pra todo mundo (fail-open, mesma regra do backend -
 * TaskCategoryService#canView) - por isso não há um toggle "restrito"/"aberto" separado, o
 * próprio estado vazio já significa aberto. "Administradores" é só um bloco informativo (sempre
 * têm acesso total, estruturalmente, via PERM_TAREFA_CONSULT) - não é uma lista carregada.
 */
@Component({
  standalone: true,
  selector: 'app-task-category-permissions-dialog',
  templateUrl: './task-category-permissions-dialog.component.html',
  imports: [DialogModule, ButtonModule, TranslateModule, MultiSelectModule, FloatLabelModule, ReactiveFormsModule],
})
export class TaskCategoryPermissionsDialogComponent implements OnInit {
  visible = input.required<boolean>();
  category = input.required<TaskCategoryModel | null>();

  @Output() saved = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly usersApi = inject(UsersApiService);
  private readonly api = inject(TasksTemplatesApiService);

  readonly i18n = inject(I18nService);
  readonly departmentsFacade = inject(DepartmentsFacade);
  readonly cargosFacade = inject(CargosFacade);

  readonly saving = signal(false);
  readonly userOptions = signal<UserOptionModel[]>([]);

  readonly departmentOptions = computed(() => this.departmentsFacade.options());
  readonly cargoOptions = computed(() => this.cargosFacade.options());

  readonly form = this.fb.nonNullable.group({
    allowedDepartmentIds: this.fb.nonNullable.control<string[]>([]),
    allowedCargoIds: this.fb.nonNullable.control<string[]>([]),
    allowedUserIds: this.fb.nonNullable.control<string[]>([]),
  });

  private lastLoadedKey: string | null = null;

  constructor() {
    effect(() => {
      if (!this.visible()) {
        this.lastLoadedKey = null;
        return;
      }

      const current = this.category();
      if (!current) return;
      if (this.lastLoadedKey === current.id) return;
      this.lastLoadedKey = current.id;

      this.form.reset({
        allowedDepartmentIds: current.allowedDepartmentIds,
        allowedCargoIds: current.allowedCargoIds,
        allowedUserIds: current.allowedUserIds,
      });
    });
  }

  ngOnInit(): void {
    this.departmentsFacade.loadOptions();
    this.cargosFacade.loadOptions();
    this.usersApi
      .getOptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => this.userOptions.set(items ?? []),
        error: () => this.userOptions.set([]),
      });
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.visibleChange.emit(false);
  }

  save(): void {
    const category = this.category();
    if (!category) return;

    this.saving.set(true);
    this.api
      .updateCategoryPermissions(category.id, this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('taskCategories.permissions.saved'),
          });
          this.saved.emit();
          this.close();
        },
        error: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('taskCategories.permissions.saveError'),
          });
        },
      });
  }
}
