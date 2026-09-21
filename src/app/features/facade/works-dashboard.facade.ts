import { Injectable, inject, signal } from '@angular/core';

import { forkJoin } from 'rxjs';

import { WorksDashboardApiService } from '@features/service/works-dashboard.api.service';
import {
  DashboardAnalyticsModel,
  DashboardFilterInput,
  DashboardSummaryModel,
  WorkDurationAnalysisModel,
} from '@models/dashboard.models';

/** Dashboard de Obras - renomeado de DashboardFacade (pedido do usuário 2026-09-21, separação dos
 *  dashboards). DashboardLoadOptions/os flags condicionais somem: esta página inteira já fica
 *  atrás de permissionGuard (OBRA_CONSULT) na própria rota, não precisa mais decidir em runtime se
 *  chama a API ou não - ver WorksDashboardComponent. */
@Injectable({ providedIn: 'root' })
export class WorksDashboardFacade {
  private readonly api = inject(WorksDashboardApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _summary = signal<DashboardSummaryModel | null>(null);
  private readonly _analytics = signal<DashboardAnalyticsModel | null>(null);
  private readonly _durationAnalysis = signal<WorkDurationAnalysisModel | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly analytics = this._analytics.asReadonly();
  readonly durationAnalysis = this._durationAnalysis.asReadonly();

  load(filter?: DashboardFilterInput): void {
    this._loading.set(true);

    forkJoin({
      summary: this.api.summary(filter),
      analytics: this.api.analytics(filter),
      durationAnalysis: this.api.workDurationAnalysis(),
    }).subscribe({
      next: ({ summary, analytics, durationAnalysis }) => {
        this._summary.set(summary);
        this._analytics.set(analytics);
        this._durationAnalysis.set(durationAnalysis);
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
