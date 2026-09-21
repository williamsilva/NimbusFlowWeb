import { Injectable, inject, signal } from '@angular/core';

import { TicketsDashboardApiService } from '@features/service/tickets-dashboard.api.service';
import { TicketDashboardSummaryModel } from '@models/dashboard.models';

/** Dashboard de Chamados (pedido do usuário 2026-09-21) - página inteira já fica atrás de
 *  permissionGuard (CHAMADO_CONSULT) na rota, sem flags condicionais. */
@Injectable({ providedIn: 'root' })
export class TicketsDashboardFacade {
  private readonly api = inject(TicketsDashboardApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _summary = signal<TicketDashboardSummaryModel | null>(null);

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
