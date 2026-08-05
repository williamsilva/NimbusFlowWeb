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
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../core/auth/auth.service';
import { StatusBadgeComponent, StatusTone } from '../shared/status-badge/status-badge.component';
import { Work, WorkService, WorkStatus } from './work.service';
import { WorkCreateDialogComponent } from './work-create-dialog.component';

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
    TranslatePipe,
  ],
  templateUrl: './work-list.component.html',
  styleUrl: './work-list.component.scss',
})
export class WorkListComponent implements OnInit {
  works: Work[] = [];
  search = '';
  displayedColumns = ['name', 'supplierName', 'status', 'startDate', 'expectedEndDate', 'totalAmount', 'actions'];
  /** OBRA_MANAGE (Fase 7) - só gateia o botão "Nova obra" (só UX, validação real é 100% backend);
   *  a ação "Gerenciar" fica visível pra todos porque a tela de detalhe também dá acesso a
   *  aditivo/medição/parcela, cada um com seu próprio gate de permissão dentro dela. */
  canManageWorks = false;

  constructor(
    private readonly workService: WorkService,
    private readonly dialog: MatDialog,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.authService.loadMe().subscribe((user) => (this.canManageWorks = user.permissions.includes('OBRA_MANAGE')));
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

  statusLabelKey(status: WorkStatus): string {
    return `works.status.${status}`;
  }

  statusTone(status: WorkStatus): StatusTone {
    return STATUS_TONES[status];
  }
}
