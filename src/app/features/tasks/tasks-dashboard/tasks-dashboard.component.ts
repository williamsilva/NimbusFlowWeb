import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ChartModule } from 'primeng/chart';
import { SelectModule } from 'primeng/select';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { ThemeService } from '@williamsilva/nimbus-web-commons';
import { SelectOption } from '@models/select-option.model';
import { TasksDashboardFacade } from '@features/facade/tasks-dashboard.facade';
import { TaskLocationsFacade } from '@features/facade/task-locations.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TasksDashboardPermissionPolicy } from '@features/tasks/tasks-dashboard-permission.policy';
import { TaskStatusCountsModel } from '@models/dashboard.models';
import { TASK_STATUS_VALUES, TaskStatusEnum, taskStatusLabel } from '@models/enums/task-status.enum';
import { TaskActivityAnalyticsApiService } from '@features/service/task-activity-analytics.api.service';
import { TaskActivityHistoryModel } from '@models/task-activity-analytics.models';

/** Mesmo corte "top N + Demais" de topWorks no dashboard de Obras - aqui feito no componente
 *  porque DashboardService.getEmployeeTaskRanking() devolve a lista completa, sem cortar. */
const TOP_EMPLOYEES_LIMIT = 7;

/** Uma cor sólida fixa por status (não depende de tema claro/escuro, diferente de
 *  primaryColor()/textColor() abaixo) - só pra distinguir visualmente as 6 barras entre si. */
const STATUS_CHART_COLORS: Record<TaskStatusEnum, string> = {
  [TaskStatusEnum.TODO]: '#9ca3af',
  [TaskStatusEnum.IN_PROGRESS]: '#3b82f6',
  [TaskStatusEnum.REVIEW]: '#f59e0b',
  [TaskStatusEnum.DONE]: '#22c55e',
  [TaskStatusEnum.CANCELLED]: '#ef4444',
  [TaskStatusEnum.NOT_DONE]: '#fb923c',
};

function statusCountValue(counts: TaskStatusCountsModel | null, status: TaskStatusEnum): number {
  if (!counts) return 0;
  switch (status) {
    case TaskStatusEnum.TODO:
      return counts.todo;
    case TaskStatusEnum.IN_PROGRESS:
      return counts.inProgress;
    case TaskStatusEnum.REVIEW:
      return counts.review;
    case TaskStatusEnum.DONE:
      return counts.done;
    case TaskStatusEnum.CANCELLED:
      return counts.cancelled;
    case TaskStatusEnum.NOT_DONE:
      return counts.notDone;
  }
}

/**
 * Dashboard de Tarefas (pedido do usuário 2026-09-21, separação dos 4 dashboards) - migrado de
 * features/dashboard/dashboard.component.ts (progresso da equipe + ranking nominal admin-only),
 * com um novo KPI de "Tempo médio de conclusão" agregado (sem quebrar por assigneeId - mesma
 * preocupação legal/trabalhista já aplicada ao ranking nominal). Página inteira já fica atrás de
 * permissionGuard (TAREFA_CONSULT/EXECUTE) na rota (/dashboard/tasks); o ranking nominal continua
 * com seu próprio gate mais restrito (DASHBOARD_RANKING_CONSULT, só ADMINISTRADOR).
 *
 * Pedido do usuário 2026-09-24: + contagem de Tarefas por status (gráfico de barras) e uma seção
 * "Parâmetros" com histórico de Atividades do tipo NÚMERO (ex.: Cloro/Alcalinidade/pH) respondidas
 * em execuções de Tarefa - seletor flexível (não fixo nesses 3 nomes), sem gate extra (mesmo nível
 * das outras métricas já aqui, protegido pela própria rota).
 */
@Component({
  standalone: true,
  selector: 'app-tasks-dashboard',
  templateUrl: './tasks-dashboard.component.html',
  imports: [ChartModule, FormsModule, SelectModule, TranslateModule, PageHeaderComponent],
})
export class TasksDashboardComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly theme = inject(ThemeService);
  private readonly activityAnalyticsApi = inject(TaskActivityAnalyticsApiService);

  readonly facade = inject(TasksDashboardFacade);
  readonly taskLocationsFacade = inject(TaskLocationsFacade);
  readonly dashboardPolicy = inject(TasksDashboardPermissionPolicy);

  readonly teamCompletedTasksCount = computed(() => this.facade.teamTaskProgress()?.teamCompletedTasksCount ?? 0);
  readonly myCompletedTasksCount = computed(() => this.facade.teamTaskProgress()?.myCompletedTasksCount ?? 0);

  private readonly _parameterOptions = signal<SelectOption<string>[]>([]);
  private readonly _parameterOptionsLoadedOnce = signal(false);
  private readonly _selectedParameter = signal<string | null>(null);
  private readonly _selectedLocationId = signal<string | null>(null);
  private readonly _history = signal<TaskActivityHistoryModel | null>(null);
  private readonly _historyLoading = signal(false);

  readonly parameterOptions = this._parameterOptions.asReadonly();
  readonly parameterOptionsLoadedOnce = this._parameterOptionsLoadedOnce.asReadonly();
  readonly selectedParameter = this._selectedParameter.asReadonly();
  readonly selectedLocationId = this._selectedLocationId.asReadonly();
  readonly history = this._history.asReadonly();
  readonly historyLoading = this._historyLoading.asReadonly();

  readonly answeredCount = computed(() => this.history()?.answeredCount ?? 0);
  readonly pendingCount = computed(() => this.history()?.pendingCount ?? 0);

  ngOnInit(): void {
    this.facade.load(this.dashboardPolicy.canViewEmployeeRanking());
    this.taskLocationsFacade.loadOptions();
    this.loadParameterOptions();
  }

  private loadParameterOptions(): void {
    this.activityAnalyticsApi.numericActivityNames().subscribe({
      next: (names) => {
        this._parameterOptions.set((names ?? []).map((name) => ({ label: name, value: name })));
        this._parameterOptionsLoadedOnce.set(true);
        if (names && names.length > 0) {
          this._selectedParameter.set(names[0]);
          this.loadHistory();
        }
      },
      error: () => this._parameterOptionsLoadedOnce.set(true),
    });
  }

  onParameterChange(value: string | null): void {
    this._selectedParameter.set(value);
    this.loadHistory();
  }

  onLocationChange(value: string | null): void {
    this._selectedLocationId.set(value);
    this.loadHistory();
  }

  private loadHistory(): void {
    const parameter = this._selectedParameter();
    if (!parameter) {
      this._history.set(null);
      return;
    }

    this._historyLoading.set(true);
    this.activityAnalyticsApi.history(parameter, this._selectedLocationId()).subscribe({
      next: (result) => {
        this._history.set(result);
        this._historyLoading.set(false);
      },
      error: () => {
        this._history.set(null);
        this._historyLoading.set(false);
      },
    });
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

  readonly taskStatusCountsChartData = computed(() => {
    this.i18n.getAppliedLang();
    const counts = this.facade.statusCounts();

    const labels = TASK_STATUS_VALUES.map((status) => taskStatusLabel(status, this.i18n));
    const data = TASK_STATUS_VALUES.map((status) => statusCountValue(counts, status));
    const backgroundColor = TASK_STATUS_VALUES.map((status) => STATUS_CHART_COLORS[status]);

    return {
      labels,
      datasets: [{ data, backgroundColor, borderRadius: 4, maxBarThickness: 40 }],
    };
  });

  readonly taskStatusCountsChartOptions = computed(() => {
    const text = this.textColor();
    const grid = this.gridColor();

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { ticks: { color: text }, grid: { display: false } },
        y: {
          ticks: { color: text, precision: 0 },
          grid: { color: grid },
        },
      },
    };
  });

  private formatHistoryPointLabel(executedAt: string): string {
    try {
      return new Intl.DateTimeFormat(this.i18n.getLocale(), {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(executedAt));
    } catch {
      return executedAt;
    }
  }

  readonly parameterHistoryChartData = computed(() => {
    this.i18n.getAppliedLang();
    const points = this.history()?.points ?? [];
    const color = this.primaryColor();

    return {
      labels: points.map((point) => this.formatHistoryPointLabel(point.executedAt)),
      datasets: [
        {
          data: points.map((point) => point.value),
          borderColor: color,
          backgroundColor: color,
          tension: 0.3,
          pointRadius: 3,
          fill: false,
        },
      ],
    };
  });

  readonly parameterHistoryChartOptions = computed(() => {
    const text = this.textColor();
    const grid = this.gridColor();

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { ticks: { color: text, maxRotation: 0, autoSkip: true }, grid: { display: false } },
        y: { ticks: { color: text }, grid: { color: grid } },
      },
    };
  });
}
