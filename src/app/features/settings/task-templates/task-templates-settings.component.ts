import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';

import { I18nService } from '@core/i18n/i18n.service';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TaskCategoryModel, TaskSubcategoryModel, TaskTemplateModel } from '@models/task-templates.models';
import { TasksTemplatesApiService } from '@features/service/tasks-templates.api.service';
import { TaskCategoryFormDialogComponent } from '@features/settings/task-templates/task-category-form-dialog.component';
import { TaskCategoryPermissionsDialogComponent } from '@features/settings/task-templates/task-category-permissions-dialog.component';
import { TaskSubcategoryFormDialogComponent } from '@features/settings/task-templates/task-subcategory-form-dialog.component';
import { TaskTemplateFormDialogComponent } from '@features/settings/task-templates/task-template-form-dialog.component';

/**
 * "Modelos de Tarefas" (pedido do usuário 2026-09-24, print de referência) - master-detail de 3
 * colunas (Categorias | Subcategorias | Modelos de Tarefas), primeiro desse tipo no portfólio
 * (sem componente existente pra copiar). Seleção na coluna 1 filtra a 2, seleção na 2 filtra a 3 -
 * sem seleção nenhuma, cada coluna mostra tudo (visão geral cross-categoria/subcategoria).
 * Listas pequenas (mesma premissa de Department/Cargo) - busca é só filtro local em memória, sem
 * paginação/backend.
 */
@Component({
  standalone: true,
  selector: 'app-task-templates-settings',
  templateUrl: './task-templates-settings.component.html',
  styleUrl: './task-templates-settings.component.scss',
  imports: [
    FormsModule,
    ButtonModule,
    TooltipModule,
    InputTextModule,
    TranslateModule,
    PageHeaderComponent,
    TaskCategoryFormDialogComponent,
    TaskCategoryPermissionsDialogComponent,
    TaskSubcategoryFormDialogComponent,
    TaskTemplateFormDialogComponent,
  ],
})
export class TaskTemplatesSettingsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(MessageService);
  private readonly confirm = inject(ConfirmationService);
  private readonly api = inject(TasksTemplatesApiService);
  private readonly perms = inject(PermissionService);

  readonly i18n = inject(I18nService);

  readonly canChange = computed(() => this.perms.hasSupportOr(PERMISSIONS.SETTINGS.TASK_TEMPLATE_CHANGE));

  readonly categories = signal<TaskCategoryModel[]>([]);
  readonly subcategories = signal<TaskSubcategoryModel[]>([]);
  readonly templates = signal<TaskTemplateModel[]>([]);

  readonly loadingCategories = signal(false);
  readonly loadingSubcategories = signal(false);
  readonly loadingTemplates = signal(false);

  readonly selectedCategoryId = signal<string | null>(null);
  readonly selectedSubcategoryId = signal<string | null>(null);

  readonly categorySearch = signal('');
  readonly subcategorySearch = signal('');
  readonly templateSearch = signal('');

  readonly filteredCategories = computed(() => {
    const term = this.categorySearch().trim().toLowerCase();
    const items = this.categories();
    return term ? items.filter((c) => c.name.toLowerCase().includes(term)) : items;
  });

  readonly filteredSubcategories = computed(() => {
    const term = this.subcategorySearch().trim().toLowerCase();
    const items = this.subcategories();
    return term ? items.filter((s) => s.name.toLowerCase().includes(term)) : items;
  });

  readonly filteredTemplates = computed(() => {
    const term = this.templateSearch().trim().toLowerCase();
    const items = this.templates();
    return term ? items.filter((t) => t.name.toLowerCase().includes(term)) : items;
  });

  readonly selectedCategory = computed(
    () => this.categories().find((c) => c.id === this.selectedCategoryId()) ?? null,
  );

  readonly categoryFormVisible = signal(false);
  readonly editingCategory = signal<TaskCategoryModel | null>(null);

  readonly permissionsDialogVisible = signal(false);
  readonly categoryForPermissions = signal<TaskCategoryModel | null>(null);

  readonly subcategoryFormVisible = signal(false);
  readonly editingSubcategory = signal<TaskSubcategoryModel | null>(null);

  readonly templateFormVisible = signal(false);
  readonly editingTemplate = signal<TaskTemplateModel | null>(null);

  ngOnInit(): void {
    this.loadCategories();
    this.loadSubcategories();
    this.loadTemplates();
  }

  private loadCategories(): void {
    this.loadingCategories.set(true);
    this.api
      .listCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.categories.set(items);
          this.loadingCategories.set(false);
        },
        error: () => {
          this.categories.set([]);
          this.loadingCategories.set(false);
        },
      });
  }

  private loadSubcategories(): void {
    this.loadingSubcategories.set(true);
    this.api
      .listSubcategories(this.selectedCategoryId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.subcategories.set(items);
          this.loadingSubcategories.set(false);
        },
        error: () => {
          this.subcategories.set([]);
          this.loadingSubcategories.set(false);
        },
      });
  }

  private loadTemplates(): void {
    this.loadingTemplates.set(true);
    this.api
      .listTemplates(this.selectedCategoryId(), this.selectedSubcategoryId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.templates.set(items);
          this.loadingTemplates.set(false);
        },
        error: () => {
          this.templates.set([]);
          this.loadingTemplates.set(false);
        },
      });
  }

  selectCategory(row: TaskCategoryModel): void {
    const next = this.selectedCategoryId() === row.id ? null : row.id;
    this.selectedCategoryId.set(next);
    this.selectedSubcategoryId.set(null);
    this.subcategorySearch.set('');
    this.templateSearch.set('');
    this.loadSubcategories();
    this.loadTemplates();
  }

  selectSubcategory(row: TaskSubcategoryModel): void {
    const next = this.selectedSubcategoryId() === row.id ? null : row.id;
    this.selectedSubcategoryId.set(next);
    this.templateSearch.set('');
    this.loadTemplates();
  }

  // --- Categorias ---

  goNewCategory(): void {
    if (!this.canChange()) return;
    this.editingCategory.set(null);
    this.categoryFormVisible.set(true);
  }

  goEditCategory(row: TaskCategoryModel): void {
    if (!this.canChange()) return;
    this.editingCategory.set(row);
    this.categoryFormVisible.set(true);
  }

  onCategoryFormVisibleChange(v: boolean): void {
    this.categoryFormVisible.set(v);
  }

  onCategorySaved(): void {
    this.loadCategories();
  }

  goManagePermissions(row: TaskCategoryModel): void {
    if (!this.canChange()) return;
    this.categoryForPermissions.set(row);
    this.permissionsDialogVisible.set(true);
  }

  onPermissionsDialogVisibleChange(v: boolean): void {
    this.permissionsDialogVisible.set(v);
  }

  onPermissionsSaved(): void {
    this.loadCategories();
  }

  confirmDeleteCategory(row: TaskCategoryModel): void {
    if (!this.canChange()) return;

    this.confirm.confirm({
      header: this.i18n.tUi('taskCategories.deleteConfirm.header'),
      message: this.i18n.tUi('taskCategories.deleteConfirm.message'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api
          .deleteCategory(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              if (this.selectedCategoryId() === row.id) {
                this.selectedCategoryId.set(null);
                this.selectedSubcategoryId.set(null);
              }
              this.loadCategories();
              this.loadSubcategories();
              this.loadTemplates();
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('taskCategories.deleteConfirm.success'),
              });
            },
            error: () =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail: this.i18n.tUi('taskCategories.deleteConfirm.error'),
              }),
          });
      },
    });
  }

  // --- Subcategorias ---

  goNewSubcategory(): void {
    if (!this.canChange() || !this.selectedCategoryId()) return;
    this.editingSubcategory.set(null);
    this.subcategoryFormVisible.set(true);
  }

  goEditSubcategory(row: TaskSubcategoryModel): void {
    if (!this.canChange()) return;
    this.editingSubcategory.set(row);
    this.subcategoryFormVisible.set(true);
  }

  onSubcategoryFormVisibleChange(v: boolean): void {
    this.subcategoryFormVisible.set(v);
  }

  onSubcategorySaved(): void {
    this.loadSubcategories();
    this.loadTemplates();
  }

  confirmDeleteSubcategory(row: TaskSubcategoryModel): void {
    if (!this.canChange()) return;

    this.confirm.confirm({
      header: this.i18n.tUi('taskSubcategories.deleteConfirm.header'),
      message: this.i18n.tUi('taskSubcategories.deleteConfirm.message'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api
          .deleteSubcategory(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              if (this.selectedSubcategoryId() === row.id) {
                this.selectedSubcategoryId.set(null);
              }
              this.loadSubcategories();
              this.loadTemplates();
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('taskSubcategories.deleteConfirm.success'),
              });
            },
            error: () =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail: this.i18n.tUi('taskSubcategories.deleteConfirm.error'),
              }),
          });
      },
    });
  }

  // --- Modelos de Tarefa ---

  goNewTemplate(): void {
    if (!this.canChange() || !this.selectedSubcategoryId()) return;
    this.editingTemplate.set(null);
    this.templateFormVisible.set(true);
  }

  goEditTemplate(row: TaskTemplateModel): void {
    if (!this.canChange()) return;
    this.editingTemplate.set(row);
    this.templateFormVisible.set(true);
  }

  onTemplateFormVisibleChange(v: boolean): void {
    this.templateFormVisible.set(v);
  }

  onTemplateSaved(): void {
    this.loadTemplates();
  }

  confirmDeleteTemplate(row: TaskTemplateModel): void {
    if (!this.canChange()) return;

    this.confirm.confirm({
      header: this.i18n.tUi('taskTemplates.deleteConfirm.header'),
      message: this.i18n.tUi('taskTemplates.deleteConfirm.message'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.api
          .deleteTemplate(row.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.loadTemplates();
              this.toast.add({
                severity: 'success',
                summary: this.i18n.tUi('common.success'),
                detail: this.i18n.tUi('taskTemplates.deleteConfirm.success'),
              });
            },
            error: () =>
              this.toast.add({
                severity: 'error',
                summary: this.i18n.tUi('common.error'),
                detail: this.i18n.tUi('taskTemplates.deleteConfirm.error'),
              }),
          });
      },
    });
  }
}
