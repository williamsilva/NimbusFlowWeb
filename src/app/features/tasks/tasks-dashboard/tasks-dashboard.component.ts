import { Component, OnInit, computed, inject } from '@angular/core';

import { ChartModule } from 'primeng/chart';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { ThemeService } from '@williamsilva/nimbus-web-commons';
import { TasksDashboardFacade } from '@features/facade/tasks-dashboard.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TasksDashboardPermissionPolicy } from '@features/tasks/tasks-dashboard-permission.policy';

/** Mesmo corte "top N + Demais" de topWorks no dashboard de Obras - aqui feito no componente
 *  porque DashboardService.getEmployeeTaskRanking() devolve a lista completa, sem cortar. */
const TOP_EMPLOYEES_LIMIT = 7;

/**
 * Dashboard de Tarefas (pedido do usuário 2026-09-21, separação dos 4 dashboards) - migrado de
 * features/dashboard/dashboard.component.ts (progresso da equipe + ranking nominal admin-only),
 * com um novo KPI de "Tempo médio de conclusão" agregado (sem quebrar por assigneeId - mesma
 * preocupação legal/trabalhista já aplicada ao ranking nominal). Página inteira já fica atrás de
 * permissionGuard (TAREFA_CONSULT/EXECUTE) na rota (/dashboard/tasks); o ranking nominal continua
 * com seu próprio gate mais restrito (DASHBOARD_RANKING_CONSULT, só ADMINISTRADOR).
 */
@Component({
  standalone: true,
  selector: 'app-tasks-dashboard',
  templateUrl: './tasks-dashboard.component.html',
  imports: [ChartModule, TranslateModule, PageHeaderComponent],
})
export class TasksDashboardComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly theme = inject(ThemeService);

  readonly facade = inject(TasksDashboardFacade);
  readonly dashboardPolicy = inject(TasksDashboardPermissionPolicy);

  readonly teamCompletedTasksCount = computed(() => this.facade.teamTaskProgress()?.teamCompletedTasksCount ?? 0);
  readonly myCompletedTasksCount = computed(() => this.facade.teamTaskProgress()?.myCompletedTasksCount ?? 0);

  ngOnInit(): void {
    this.facade.load(this.dashboardPolicy.canViewEmployeeRanking());
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

  private readonly primaryColor = computed(() => this.cssVar('--primary-color', '#0d9488'));

  /** Ranking de funcionários por tarefas concluídas - sem formatação monetária (eixo/tooltip
   *  mostram contagem simples). */
  readonly employeeTaskRankingChartData = computed(() => {
    this.i18n.getAppliedLang();
    const ranking = this.facade.employeeTaskRanking();
    const top = ranking.slice(0, TOP_EMPLOYEES_LIMIT);
    const others = ranking.slice(TOP_EMPLOYEES_LIMIT);
    const color = this.primaryColor();

    const labels = top.map((item) => item.employeeName);
    const data = top.map((item) => item.completedTasksCount);

    if (others.length > 0) {
      labels.push(
        this.i18n.tUi('tasks.dashboard.charts.employeeTaskRanking.others' as never, {
          count: others.length,
        }),
      );
      data.push(others.reduce((sum, item) => sum + item.completedTasksCount, 0));
    }

    return {
      labels,
      datasets: [{ data, backgroundColor: color, borderRadius: 4, maxBarThickness: 28 }],
    };
  });

  readonly employeeTaskRankingChartOptions = computed(() => {
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
        x: {
          ticks: { color: text, precision: 0 },
          grid: { color: grid },
        },
        y: { ticks: { color: text }, grid: { display: false } },
      },
    };
  });
}
