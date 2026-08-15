import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { ChartModule } from 'primeng/chart';
import { FloatLabel } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';

import { I18nService } from '@core/i18n/i18n.service';
import { ThemeService } from '@core/theme/theme.service';
import { WorksFacade } from '@features/facade/works.facade';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { DashboardFacade } from '@features/facade/dashboard.facade';
import { ProjectsFacade } from '@features/facade/projects.facade';
import { SuppliersFacade } from '@features/facade/suppliers.facade';
import { DashboardFilterInput } from '@models/dashboard.models';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { projectStatusTone } from '@models/enums/project-status.enum';
import { WorkStatusEnum, workStatusTone } from '@models/enums/work-status.enum';
import {
  currencyRangeLabel,
  CsCurrencyRangeFilterComponent,
} from '@features/list-base/cs-currency-range-filter.component';
import {
  ActiveFilterItem,
  FiltersPanelComponent,
} from '@shared/features/filters-panel/filters-panel.component';

/** Mesmas cores do status-badge (status-badge.component.scss) - um status tem sempre a mesma cor em toda a tela. */
const STATUS_COLORS: Record<WorkStatusEnum, string> = {
  [WorkStatusEnum.PLANNED]: '#3b82f6',
  [WorkStatusEnum.IN_PROGRESS]: '#f59e0b',
  [WorkStatusEnum.PAUSED]: '#94a3b8',
  [WorkStatusEnum.COMPLETED]: '#22c55e',
  [WorkStatusEnum.CANCELLED]: '#ef4444',
};

const BRL_FORMAT = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const BRL_COMPACT_FORMAT = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
});

/** Mesmo corte "top N + Demais" de topWorks acima - aqui feito no componente porque
 *  DashboardService.getEmployeeTaskRanking() devolve a lista completa, sem cortar (ver seu
 *  javadoc no backend). */
const TOP_EMPLOYEES_LIMIT = 7;

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [
    DecimalPipe,
    FormsModule,
    ChartModule,
    FloatLabel,
    TranslateModule,
    CsCurrencyPipe,
    MultiSelectModule,
    ProgressBarModule,
    PageHeaderComponent,
    FiltersPanelComponent,
    StatusBadgeComponent,
    CsCurrencyRangeFilterComponent,
  ],
})
export class DashboardComponent implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly theme = inject(ThemeService);

  readonly facade = inject(DashboardFacade);
  readonly projectsFacade = inject(ProjectsFacade);
  readonly suppliersFacade = inject(SuppliersFacade);
  readonly worksFacade = inject(WorksFacade);

  readonly projects = this.projectsFacade.items;
  readonly projectOptions = this.projectsFacade.options;
  readonly supplierOptions = this.suppliersFacade.options;
  readonly workOptions = this.worksFacade.options;

  readonly tone = workStatusTone;
  readonly projectTone = projectStatusTone;

  readonly projectId = signal<string[] | null>(null);
  readonly supplierId = signal<string[] | null>(null);
  readonly workId = signal<string[] | null>(null);
  readonly totalAmountFrom = signal<number | null>(null);
  readonly totalAmountTo = signal<number | null>(null);

  readonly activeFiltersCount = computed(() => this.activeFilters().length);

  readonly activeFilters = computed<ActiveFilterItem[]>(() => {
    this.i18n.getAppliedLang();
    const items: ActiveFilterItem[] = [];

    const projectId = this.projectId();
    if (projectId?.length) {
      const labels = this.projectOptions()
        .filter((opt) => projectId.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('dashboard.filters.project' as never), value: labels });
    }

    const supplierId = this.supplierId();
    if (supplierId?.length) {
      const labels = this.supplierOptions()
        .filter((opt) => supplierId.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('dashboard.filters.supplier' as never), value: labels });
    }

    const workId = this.workId();
    if (workId?.length) {
      const labels = this.workOptions()
        .filter((opt) => workId.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('dashboard.filters.work' as never), value: labels });
    }

    const amountLabel = currencyRangeLabel(this.i18n, this.totalAmountFrom(), this.totalAmountTo());
    if (amountLabel) {
      items.push({ label: this.i18n.tUi('dashboard.filters.totalAmount' as never), value: amountLabel });
    }

    return items;
  });

  readonly worksTotalCount = computed(() => {
    const byStatus = this.facade.summary()?.worksByStatus ?? {};
    return Object.values(byStatus).reduce((sum, count) => sum + (count ?? 0), 0);
  });

  readonly worksByStatusEntries = computed(() => {
    this.i18n.getAppliedLang();
    const byStatus = this.facade.summary()?.worksByStatus ?? {};
    return Object.entries(byStatus)
      .filter(([, count]) => (count ?? 0) > 0)
      .map(([status, count]) => ({ status: status as WorkStatusEnum, count: count ?? 0 }));
  });

  ngOnInit(): void {
    this.facade.load();
    this.projectsFacade.loadAll();
    this.suppliersFacade.loadSupplierOptions();
    this.worksFacade.loadOptions();
  }

  search(): void {
    this.facade.load(this.buildFilter());
  }

  clear(): void {
    this.projectId.set(null);
    this.supplierId.set(null);
    this.workId.set(null);
    this.totalAmountFrom.set(null);
    this.totalAmountTo.set(null);
    this.facade.load();
  }

  private buildFilter(): DashboardFilterInput {
    return {
      projectIds: this.projectId()?.length ? this.projectId() : undefined,
      supplierIds: this.supplierId()?.length ? this.supplierId() : undefined,
      workIds: this.workId()?.length ? this.workId() : undefined,
      totalAmountFrom: this.totalAmountFrom() ?? undefined,
      totalAmountTo: this.totalAmountTo() ?? undefined,
    };
  }

  statusLabel(status: WorkStatusEnum): string {
    return this.i18n.tUi(`works.status.${status}` as never);
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

  readonly statusChartData = computed(() => {
    this.i18n.getAppliedLang();
    const items = this.facade.analytics()?.valueByStatus ?? [];

    return {
      labels: [''],
      datasets: items.map((item) => ({
        label: this.statusLabel(item.status),
        data: [item.amount],
        backgroundColor: STATUS_COLORS[item.status] ?? '#94a3b8',
        borderRadius: 4,
        borderSkipped: false,
      })),
    };
  });

  readonly statusChartOptions = computed(() => ({
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; raw: unknown }) =>
            `${ctx.dataset.label}: ${BRL_FORMAT.format(Number(ctx.raw))}`,
        },
      },
    },
    scales: {
      x: { stacked: true, display: false },
      y: { stacked: true, display: false },
    },
  }));

  readonly weeklyChartData = computed(() => {
    this.i18n.getAppliedLang();
    const items = this.facade.analytics()?.weeklyDisbursement ?? [];
    const color = this.primaryColor();

    return {
      labels: items.map((item) => this.formatWeekLabel(item.weekStart)),
      datasets: [
        {
          label: this.i18n.tUi('dashboard.charts.weeklyDisbursement.series' as never),
          data: items.map((item) => item.amount),
          backgroundColor: color,
          borderRadius: 4,
          maxBarThickness: 56,
        },
      ],
    };
  });

  readonly weeklyChartOptions = computed(() => {
    const text = this.textColor();
    const grid = this.gridColor();

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { raw: unknown }) => BRL_FORMAT.format(Number(ctx.raw)),
          },
        },
      },
      scales: {
        x: { ticks: { color: text }, grid: { display: false } },
        y: {
          ticks: { color: text, callback: (value: number) => BRL_COMPACT_FORMAT.format(value) },
          grid: { color: grid },
        },
      },
    };
  });

  readonly topWorksChartData = computed(() => {
    this.i18n.getAppliedLang();
    const analytics = this.facade.analytics();
    const top = analytics?.topWorks ?? [];
    const color = this.primaryColor();

    const labels = top.map((item) => item.workName);
    const data = top.map((item) => item.amount);

    if (analytics && analytics.othersCount > 0) {
      labels.push(
        this.i18n.tUi('dashboard.charts.topWorks.others' as never, { count: analytics.othersCount }),
      );
      data.push(analytics.othersAmount);
    }

    return {
      labels,
      datasets: [{ data, backgroundColor: color, borderRadius: 4, maxBarThickness: 28 }],
    };
  });

  readonly topWorksChartOptions = computed(() => {
    const text = this.textColor();
    const grid = this.gridColor();

    return {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { raw: unknown }) => BRL_FORMAT.format(Number(ctx.raw)),
          },
        },
      },
      scales: {
        x: {
          ticks: { color: text, callback: (value: number) => BRL_COMPACT_FORMAT.format(value) },
          grid: { color: grid },
        },
        y: { ticks: { color: text }, grid: { display: false } },
      },
    };
  });

  /** Ranking de funcionários por tarefas concluídas - mesmo espírito de topWorksChartData/
   *  Options, só que sem formatação monetária (eixo/tooltip mostram contagem simples). */
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
        this.i18n.tUi('dashboard.charts.employeeTaskRanking.others' as never, {
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

  private formatWeekLabel(weekStart: string): string {
    const [year, month, day] = weekStart.split('-').map(Number);
    if (!year || !month || !day) return weekStart;
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
  }
}
