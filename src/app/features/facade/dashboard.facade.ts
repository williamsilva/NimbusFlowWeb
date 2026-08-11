import { Injectable, inject, signal } from '@angular/core';

import { forkJoin } from 'rxjs';

import { DashboardApiService } from '@features/service/dashboard.api.service';
import {
  DashboardAnalyticsModel,
  DashboardFilterInput,
  DashboardSummaryModel,
} from '@models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly api = inject(DashboardApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _summary = signal<DashboardSummaryModel | null>(null);
  private readonly _analytics = signal<DashboardAnalyticsModel | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly summary = this._summary.asReadonly();
  readonly analytics = this._analytics.asReadonly();

  load(filter?: DashboardFilterInput): void {
    this._loading.set(true);

    forkJoin({
      summary: this.api.summary(filter),
      analytics: this.api.analytics(filter),
    }).subscribe({
      next: ({ summary, analytics }) => {
        this._summary.set(summary);
        this._analytics.set(analytics);
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
