import { Injectable, inject, signal } from '@angular/core';

import { ActionPlansDashboardApiService } from '@features/service/action-plans-dashboard.api.service';
import { ActionPlanDashboardSummaryModel } from '@models/dashboard.models';

/** Dashboard de Planos de Ação (pedido do usuário 2026-09-21) - página inteira já fica atrás de
 *  permissionGuard (PLANO_ACAO_CONSULT) na rota, sem flags condicionais. */
@Injectable({ providedIn: 'root' })
export class ActionPlansDashboardFacade {
  private readonly api = inject(ActionPlansDashboardApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _summary = signal<ActionPlanDashboardSummaryModel | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly summary = this._summary.asReadonly();

  load(): void {
    this._loading.set(true);

    this.api.summary().subscribe({
      next: (summary) => {
        this._summary.set(summary);
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
