import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../core/auth/auth.service';
import { I18nService } from '../core/i18n/i18n.service';
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
    imports: [
        RouterLink,
        DecimalPipe,
        FormsModule,
        ButtonModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        TableModule,
        TooltipModule,
        StatusBadgeComponent,
        TranslatePipe,
    ],
    templateUrl: './work-list.component.html',
    styleUrl: './work-list.component.scss'
})
export class WorkListComponent implements OnInit {
  works: Work[] = [];
  search = '';
  /** OBRA_MANAGE (Fase 7) - só gateia o botão "Nova obra" (só UX, validação real é 100% backend);
   *  a ação "Gerenciar" fica visível pra todos porque a tela de detalhe também dá acesso a
   *  aditivo/medição/parcela, cada um com seu próprio gate de permissão dentro dela. */
  canManageWorks = false;

  constructor(
    private readonly workService: WorkService,
    private readonly dialogService: DialogService,
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
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
    const ref = this.dialogService.open<WorkCreateDialogComponent, void>(WorkCreateDialogComponent, {
      header: this.i18n.tUi('works.createDialog.title'),
      width: '640px',
      modal: true,
    });

    ref?.onClose.subscribe((created) => {
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
