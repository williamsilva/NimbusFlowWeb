import { Injectable, inject, signal } from '@angular/core';

import { forkJoin, of } from 'rxjs';

import { DashboardApiService } from '@features/service/dashboard.api.service';
import {
  DashboardAnalyticsModel,
  DashboardFilterInput,
  DashboardSummaryModel,
  EmployeeTaskRankingModel,
} from '@models/dashboard.models';

/** Achado real 2026-09-20: os widgets de Obras (summary/analytics) e o ranking de tarefas
 *  aparecia pra qualquer usuário, mesmo sem permissão de ver Obras/Tarefas (grupo Operacional,
 *  por ex., só tem TAREFA_* - via financeiro de Obras que não devia). Flags opcionais evitam a
 *  chamada de rede de propósito (não é só esconder na tela) - ver DashboardComponent.ngOnInit,
 *  que decide via WorksPermissionPolicy/TasksPermissionPolicy antes de chamar load(). */
export interface DashboardLoadOptions {
  loadWorks?: boolean;
  loadTasks?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly api = inject(DashboardApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _summary = signal<DashboardSummaryModel | null>(null);
  private readonly _analytics = signal<DashboardAnalyticsModel | null>(null);
  private readonly _employeeTaskRanking = signal<EmployeeTaskRankingModel[]>([]);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly analytics = this._analytics.asReadonly();
  readonly employeeTaskRanking = this._employeeTaskRanking.asReadonly();

  load(filter?: DashboardFilterInput, options?: DashboardLoadOptions): void {
    const loadWorks = options?.loadWorks ?? true;
    const loadTasks = options?.loadTasks ?? true;
    this._loading.set(true);

    forkJoin({
      summary: loadWorks ? this.api.summary(filter) : of(null),
      analytics: loadWorks ? this.api.analytics(filter) : of(null),
      employeeTaskRanking: loadTasks ? this.api.employeeTaskRanking() : of([]),
    }).subscribe({
      next: ({ summary, analytics, employeeTaskRanking }) => {
        this._summary.set(summary);
        this._analytics.set(analytics);
        this._employeeTaskRanking.set(employeeTaskRanking);
        this._loading.set(false);
        this._loadedOnce.set(true);
      },
      error: () => {
        this._loading.set(false);
        this._loadedOnce.set(true);
      },
    });
  }
}
