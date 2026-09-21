import { Component, OnInit, computed, inject } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { ActionPlansDashboardFacade } from '@features/facade/action-plans-dashboard.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import {
  ACTION_PLAN_STATUS_VALUES,
  actionPlanStatusLabel,
  actionPlanStatusTone,
} from '@models/enums/action-plan-status.enum';

/**
 * Dashboard de Planos de Ação (pedido do usuário 2026-09-21, separação dos 4 dashboards) -
 * net-novo, não existia nenhum conteúdo de Planos de Ação no dashboard antigo. Página inteira já
 * fica atrás de permissionGuard (PLANO_ACAO_CONSULT) na rota (/dashboard/action-plans).
 */
@Component({
  standalone: true,
  selector: 'app-action-plans-dashboard',
  templateUrl: './action-plans-dashboard.component.html',
  imports: [TranslateModule, PageHeaderComponent, StatusBadgeComponent],
})
export class ActionPlansDashboardComponent implements OnInit {
  private readonly i18n = inject(I18nService);

  readonly facade = inject(ActionPlansDashboardFacade);

  readonly tone = actionPlanStatusTone;

  ngOnInit(): void {
    this.facade.load();
  }

  statusLabel(status: string): string {
    return actionPlanStatusLabel(status, this.i18n);
  }

  readonly totalCount = computed(() => {
    const byStatus = this.facade.summary()?.byStatus ?? {};
    return Object.values(byStatus).reduce((sum, count) => sum + (count ?? 0), 0);
  });

  readonly byStatusEntries = computed(() => {
    this.i18n.getAppliedLang();
    const byStatus = this.facade.summary()?.byStatus ?? {};
    return ACTION_PLAN_STATUS_VALUES.map((status) => ({ status, count: byStatus[status] ?? 0 }));
  });
}
