import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartConfiguration, ChartData } from 'chart.js';
import * as L from 'leaflet';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin } from 'rxjs';

import {
  DashboardService,
  DashboardSummary,
  PendingApprovals,
  SupplierRanking,
  WorkTimelineEvent,
} from './dashboard.service';
import { Work, WorkService, WorkStatus } from '../works/work.service';

// Mesmo fix de ícone do map-picker.component.ts (Leaflet resolve os assets errado sob o build do Angular).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'leaflet/marker-icon-2x.png',
  iconUrl: 'leaflet/marker-icon.png',
  shadowUrl: 'leaflet/marker-shadow.png',
});

// Mesmo ponto usado em map-picker.component.ts - ver PROJECT_SPEC.md seção 3.2/geolocalização.
const ACQUAMANIA_CENTER: L.LatLngTuple = [-20.5358896, -40.4557522];

const STATUS_LABELS: Record<WorkStatus, string> = {
  PLANNED: 'Planejada',
  IN_PROGRESS: 'Em andamento',
  PAUSED: 'Paralisada',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};

const STATUS_COLORS: Record<WorkStatus, string> = {
  PLANNED: '#9e9e9e',
  IN_PROGRESS: '#1976d2',
  PAUSED: '#f57c00',
  COMPLETED: '#388e3c',
  CANCELLED: '#c62828',
};

const TIMELINE_LABELS: Record<string, string> = {
  WORK_STARTED: 'Início da obra',
  WORK_COMPLETED: 'Conclusão da obra',
  ADDENDUM_REQUESTED: 'Aditivo solicitado',
  ADDENDUM_APPROVED: 'Aditivo aprovado',
  ADDENDUM_REJECTED: 'Aditivo reprovado',
  MEASUREMENT_SUBMITTED: 'Medição enviada',
  MEASUREMENT_APPROVED: 'Medição aprovada',
  MEASUREMENT_REJECTED: 'Medição reprovada',
  INSTALLMENT_RELEASED: 'Parcela liberada',
  INSTALLMENT_PAID: 'Parcela paga',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    BaseChartDirective,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  loading = true;
  summary: DashboardSummary | null = null;
  overdueWorks: Work[] = [];
  pendingApprovals: PendingApprovals | null = null;
  supplierRanking: SupplierRanking[] = [];
  works: Work[] = [];

  readonly statusOptions = Object.keys(STATUS_LABELS) as WorkStatus[];
  readonly overdueColumns = ['name', 'supplierName', 'expectedEndDate', 'status'];
  readonly rankingColumns = ['supplierName', 'totalContracted', 'totalPaid'];

  statusChartData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  readonly statusChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  rankingChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  readonly rankingChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    plugins: { legend: { display: true } },
  };

  readonly mapId = `dashboard-map-${Math.random().toString(36).slice(2)}`;
  mapStatusFilter: WorkStatus | 'ALL' = 'ALL';
  private map?: L.Map;
  private markersLayer?: L.LayerGroup;

  selectedWorkIdForTimeline = '';
  timelineEvents: WorkTimelineEvent[] = [];
  loadingTimeline = false;

  exportingPdf = false;
  exportingExcel = false;

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly workService: WorkService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.loadMapMarkers();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private loadDashboardData(): void {
    this.loading = true;
    forkJoin({
      summary: this.dashboardService.getSummary(),
      overdueWorks: this.dashboardService.getOverdueWorks(),
      pendingApprovals: this.dashboardService.getPendingApprovals(),
      supplierRanking: this.dashboardService.getSupplierRanking(),
      works: this.workService.list(),
    }).subscribe({
      next: ({ summary, overdueWorks, pendingApprovals, supplierRanking, works }) => {
        this.summary = summary;
        this.overdueWorks = overdueWorks;
        this.pendingApprovals = pendingApprovals;
        this.supplierRanking = supplierRanking;
        this.works = works;
        this.buildStatusChart(summary);
        this.buildRankingChart(supplierRanking);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Não foi possível carregar os dados do dashboard.', 'Ok', { duration: 5000 });
      },
    });
  }

  private buildStatusChart(summary: DashboardSummary): void {
    const entries = Object.entries(summary.worksByStatus) as [WorkStatus, number][];
    this.statusChartData = {
      labels: entries.map(([status]) => STATUS_LABELS[status]),
      datasets: [
        {
          data: entries.map(([, count]) => count),
          backgroundColor: entries.map(([status]) => STATUS_COLORS[status]),
        },
      ],
    };
  }

  private buildRankingChart(ranking: SupplierRanking[]): void {
    const top = ranking.slice(0, 8);
    this.rankingChartData = {
      labels: top.map((r) => r.supplierName),
      datasets: [
        { label: 'Contratado', data: top.map((r) => r.totalContracted), backgroundColor: '#1976d2' },
        { label: 'Pago', data: top.map((r) => r.totalPaid), backgroundColor: '#388e3c' },
      ],
    };
  }

  // ------------------------- Mapa -------------------------

  private initMap(): void {
    this.map = L.map(this.mapId).setView(ACQUAMANIA_CENTER, 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);
    this.markersLayer = L.layerGroup().addTo(this.map);
  }

  onMapStatusFilterChange(): void {
    this.loadMapMarkers();
  }

  private loadMapMarkers(): void {
    const status = this.mapStatusFilter === 'ALL' ? undefined : this.mapStatusFilter;
    this.workService.list(status).subscribe((works) => {
      this.markersLayer?.clearLayers();
      works.forEach((work) => {
        const color = STATUS_COLORS[work.status];
        L.circleMarker([work.latitude, work.longitude], {
          radius: 9,
          color,
          fillColor: color,
          fillOpacity: 0.8,
        })
          .bindPopup(
            `<strong>${this.escapeHtml(work.name)}</strong><br>${this.escapeHtml(STATUS_LABELS[work.status])}<br>${this.escapeHtml(work.supplierName)}`,
          )
          .addTo(this.markersLayer!);
      });
    });
  }

  private escapeHtml(value: string): string {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }

  // ------------------------- Timeline -------------------------

  onTimelineWorkChange(): void {
    if (!this.selectedWorkIdForTimeline) {
      this.timelineEvents = [];
      return;
    }
    this.loadingTimeline = true;
    this.dashboardService.getWorkTimeline(this.selectedWorkIdForTimeline).subscribe({
      next: (events) => {
        this.timelineEvents = events;
        this.loadingTimeline = false;
      },
      error: () => {
        this.loadingTimeline = false;
        this.snackBar.open('Não foi possível carregar a linha do tempo da obra.', 'Ok', { duration: 4000 });
      },
    });
  }

  timelineLabel(type: string): string {
    return TIMELINE_LABELS[type] ?? type;
  }

  statusLabel(status: WorkStatus): string {
    return STATUS_LABELS[status];
  }

  // ------------------------- Exportação -------------------------

  exportPdf(): void {
    this.exportingPdf = true;
    this.dashboardService.exportPdf().subscribe({
      next: (blob) => {
        this.downloadBlob(blob, 'nimbusflow-relatorio.pdf');
        this.exportingPdf = false;
      },
      error: () => {
        this.exportingPdf = false;
        this.snackBar.open('Não foi possível gerar o relatório em PDF.', 'Ok', { duration: 4000 });
      },
    });
  }

  exportExcel(): void {
    this.exportingExcel = true;
    this.dashboardService.exportExcel().subscribe({
      next: (blob) => {
        this.downloadBlob(blob, 'nimbusflow-relatorio.xlsx');
        this.exportingExcel = false;
      },
      error: () => {
        this.exportingExcel = false;
        this.snackBar.open('Não foi possível gerar o relatório em Excel.', 'Ok', { duration: 4000 });
      },
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
}
