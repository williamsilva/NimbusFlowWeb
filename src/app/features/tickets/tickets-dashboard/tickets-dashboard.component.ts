import { Component, OnInit, computed, inject } from '@angular/core';

import { ChartModule } from 'primeng/chart';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { ThemeService } from '@williamsilva/nimbus-web-commons';
import { TicketsDashboardFacade } from '@features/facade/tickets-dashboard.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TICKET_PRIORITY_VALUES, TicketPriorityEnum } from '@models/enums/ticket-priority.enum';

/** Mesmas cores de tom já usadas pro badge de prioridade (ticketPriorityTone: HIGH=danger,
 *  MEDIUM=warn, LOW=info) - mesmos hex já usados nos outros dashboards pra esses tons. */
const PRIORITY_COLORS: Record<TicketPriorityEnum, string> = {
  [TicketPriorityEnum.HIGH]: '#ef4444',
  [TicketPriorityEnum.MEDIUM]: '#f59e0b',
  [TicketPriorityEnum.LOW]: '#3b82f6',
};

/**
 * Dashboard de Chamados (pedido do usuário 2026-09-21, separação dos 4 dashboards) - net-novo,
 * não existia nenhum conteúdo de Chamados no dashboard antigo. Página inteira já fica atrás de
 * permissionGuard (CHAMADO_CONSULT) na rota (/dashboard/tickets); a média já vem escopada por
 * departamento/target/autor (ver TicketsDashboardService no backend, que reaproveita
 * TicketService#findAll em vez de recalcular o escopo).
 */
@Component({
  standalone: true,
  selector: 'app-tickets-dashboard',
  templateUrl: './tickets-dashboard.component.html',
  imports: [ChartModule, TranslateModule, PageHeaderComponent],
})
export class TicketsDashboardComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly theme = inject(ThemeService);

  readonly facade = inject(TicketsDashboardFacade);

  ngOnInit(): void {
    this.facade.load();
  }

  priorityLabel(priority: TicketPriorityEnum): string {
    return this.i18n.tUi(`tickets.priority.${priority}` as never);
  }

  private cssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  private readonly textColor = computed(() => {
    const dark = this.theme.mode() === 'dark';
    return this.cssVar('--text-color-secondary', dark ? '#a1a1aa' : '#57534e');
  });

  private readonly gridColor = computed(() =>
    this.theme.mode() === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  );

  /** Tempo médio de resolução quebrado por prioridade - mesmo espírito de topWorksChartData no
   *  dashboard de Obras, só que com dias em vez de moeda. */
  readonly durationByPriorityChartData = computed(() => {
    this.i18n.getAppliedLang();
    const byPriority = this.facade.summary()?.byPriority ?? [];

    const labels = TICKET_PRIORITY_VALUES.map((priority) => this.priorityLabel(priority));
    const data = TICKET_PRIORITY_VALUES.map((priority) => {
      const entry = byPriority.find((p) => p.priority === priority);
      return entry?.avgResolutionDays ?? 0;
    });
    const colors = TICKET_PRIORITY_VALUES.map((priority) => PRIORITY_COLORS[priority]);

    return {
      labels,
      datasets: [{ data, backgroundColor: colors, borderRadius: 4, maxBarThickness: 28 }],
    };
  });

  readonly durationByPriorityChartOptions = computed(() => {
    const text = this.textColor();
    const grid = this.gridColor();

    return {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { ticks: { color: text }, grid: { color: grid } },
        y: { ticks: { color: text }, grid: { display: false } },
      },
    };
  });
}
