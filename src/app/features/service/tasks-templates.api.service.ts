import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import {
  TaskCategoryApiModel,
  TaskCategoryInput,
  TaskCategoryOptionApiModel,
  TaskCategoryPermissionsInput,
  TaskSubcategoryApiModel,
  TaskSubcategoryInput,
  TaskSubcategoryOptionApiModel,
  TaskTemplateApiModel,
  TaskTemplateInput,
  mapTaskCategoryApiModel,
  mapTaskCategoryApiModels,
  mapTaskSubcategoryApiModel,
  mapTaskSubcategoryApiModels,
  mapTaskTemplateApiModel,
  mapTaskTemplateApiModels,
} from '@models/task-templates.models';

/** Categoria/Subcategoria/Modelo de Tarefa (pedido do usuário 2026-09-24, menu Configurações >
 *  Modelos de Tarefas) - as 3 entidades ficam num serviço só (espelha TasksApiService na forma)
 *  porque a tela é um master-detail único das 3 colunas, sempre usadas juntas. */
@Injectable({ providedIn: 'root' })
export class TasksTemplatesApiService {
  private readonly http = inject(HttpClient);
  private readonly categoriesUrl = `${API.bff}/v1/task-categories`;
  private readonly subcategoriesUrl = `${API.bff}/v1/task-subcategories`;
  private readonly templatesUrl = `${API.bff}/v1/task-templates`;

  // --- Categorias ---

  listCategories() {
    return this.http.get<TaskCategoryApiModel[]>(this.categoriesUrl).pipe(map(mapTaskCategoryApiModels));
  }

  /** Pro seletor de Categoria na criação de Tarefa - já filtrado por permissão do usuário atual. */
  categoryOptions() {
    return this.http.get<TaskCategoryOptionApiModel[]>(`${this.categoriesUrl}/options`);
  }

  createCategory(input: TaskCategoryInput) {
    return this.http.post<TaskCategoryApiModel>(this.categoriesUrl, input).pipe(map(mapTaskCategoryApiModel));
  }

  updateCategory(id: string, input: TaskCategoryInput) {
    return this.http.put<TaskCategoryApiModel>(`${this.categoriesUrl}/${id}`, input).pipe(map(mapTaskCategoryApiModel));
  }

  updateCategoryPermissions(id: string, input: TaskCategoryPermissionsInput) {
    return this.http
      .put<TaskCategoryApiModel>(`${this.categoriesUrl}/${id}/permissions`, input)
      .pipe(map(mapTaskCategoryApiModel));
  }

  deleteCategory(id: string) {
    return this.http.delete<void>(`${this.categoriesUrl}/${id}`);
  }

  // --- Subcategorias ---

  /** @param categoryId nulo = todas as subcategorias, de qualquer categoria. */
  listSubcategories(categoryId?: string | null) {
    let params = new HttpParams();
    if (categoryId) params = params.set('categoryId', categoryId);
    return this.http
      .get<TaskSubcategoryApiModel[]>(this.subcategoriesUrl, { params })
      .pipe(map(mapTaskSubcategoryApiModels));
  }

  /** Pro seletor de Subcategoria na criação de Tarefa - só as da Categoria escolhida. */
  subcategoryOptions(categoryId: string) {
    const params = new HttpParams().set('categoryId', categoryId);
    return this.http.get<TaskSubcategoryOptionApiModel[]>(`${this.subcategoriesUrl}/options`, { params });
  }

  createSubcategory(input: TaskSubcategoryInput) {
    return this.http
      .post<TaskSubcategoryApiModel>(this.subcategoriesUrl, input)
      .pipe(map(mapTaskSubcategoryApiModel));
  }

  updateSubcategory(id: string, input: TaskSubcategoryInput) {
    return this.http
      .put<TaskSubcategoryApiModel>(`${this.subcategoriesUrl}/${id}`, input)
      .pipe(map(mapTaskSubcategoryApiModel));
  }

  deleteSubcategory(id: string) {
    return this.http.delete<void>(`${this.subcategoriesUrl}/${id}`);
  }

  // --- Modelos de Tarefa ---

  /** @param categoryId ignorado se subcategoryId for informado. Ambos nulos = todos os modelos. */
  listTemplates(categoryId?: string | null, subcategoryId?: string | null) {
    let params = new HttpParams();
    if (categoryId) params = params.set('categoryId', categoryId);
    if (subcategoryId) params = params.set('subcategoryId', subcategoryId);
    return this.http.get<TaskTemplateApiModel[]>(this.templatesUrl, { params }).pipe(map(mapTaskTemplateApiModels));
  }

  getTemplateById(id: string) {
    return this.http.get<TaskTemplateApiModel>(`${this.templatesUrl}/${id}`).pipe(map(mapTaskTemplateApiModel));
  }

  /** Pro picker "Criar a partir de um modelo" na criação de Tarefa - filtrado por permissão de
   *  Categoria do usuário atual. Já devolve o Modelo completo (com Atividades) por item, sem
   *  precisar de uma segunda chamada por id (ver TaskTemplatePickerDialogComponent#confirm). */
  templateOptions(subcategoryId: string) {
    const params = new HttpParams().set('subcategoryId', subcategoryId);
    return this.http
      .get<TaskTemplateApiModel[]>(`${this.templatesUrl}/options`, { params })
      .pipe(map(mapTaskTemplateApiModels));
  }

  createTemplate(input: TaskTemplateInput) {
    return this.http.post<TaskTemplateApiModel>(this.templatesUrl, input).pipe(map(mapTaskTemplateApiModel));
  }

  updateTemplate(id: string, input: TaskTemplateInput) {
    return this.http.put<TaskTemplateApiModel>(`${this.templatesUrl}/${id}`, input).pipe(map(mapTaskTemplateApiModel));
  }

  deleteTemplate(id: string) {
    return this.http.delete<void>(`${this.templatesUrl}/${id}`);
  }
}
