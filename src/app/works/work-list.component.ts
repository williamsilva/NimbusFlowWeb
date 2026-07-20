import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { StatusBadgeComponent, StatusTone } from '../shared/status-badge/status-badge.component';
import { Work, WorkService, WorkStatus } from './work.service';
import { WorkCreateDialogComponent } from './work-create-dialog.component';

const STATUS_LABELS: Record<WorkStatus, string> = {
  PLANNED: 'Planejada',
  IN_PROGRESS: 'Em andamento',
  PAUSED: 'Pausada',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};

const STATUS_TONES: Record<WorkStatus, StatusTone> = {
  PLANNED: 'info',
  IN_PROGRESS: 'warn',
  PAUSED: 'neutral',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

@Component({
  selector: 'app-work-list',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    StatusBadgeComponent,
  ],
  templateUrl: './work-list.component.html',
  styleUrl: './work-list.component.scss',
})
export class WorkListComponent implements OnInit {
  works: Work[] = [];
  search = '';
  displayedColumns = ['name', 'supplierName', 'status', 'startDate', 'expectedEndDate', 'totalAmount', 'actions'];

  constructor(
    private readonly workService: WorkService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get filteredWorks(): Work[] {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      return this.works;
    }
    return this.works.filter((work) =>
      [work.name, work.supplierName].some((value) => value.toLowerCase().includes(term)),
    );
  }

  load(): void {
    this.workService.list().subscribe((works) => (this.works = works));
  }

  openCreate(): void {
    const ref = this.dialog.open<WorkCreateDialogComponent, void, Work | false>(WorkCreateDialogComponent, {
      autoFocus: false,
    });

    ref.afterClosed().subscribe((created) => {
      if (created) {
        this.load();
      }
    });
  }

  statusLabel(status: WorkStatus): string {
    return STATUS_LABELS[status];
  }

  statusTone(status: WorkStatus): StatusTone {
    return STATUS_TONES[status];
  }
}
