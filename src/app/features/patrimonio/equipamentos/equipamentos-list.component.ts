import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { EquipamentoModel } from '@models/equipamentos.models';
import { EquipamentosFacade } from '@features/facade/equipamentos.facade';
import { statusEquipamentoTone } from '@models/patrimonio-enums';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { StatusBadgeComponent, StatusTone } from '@shared/features/status-badge/status-badge.component';
import { PatrimonioPermissionPolicy } from '@features/patrimonio/patrimonio-permission.policy';
import { EquipamentoFormDialogComponent } from '@features/patrimonio/equipamentos/equipamento-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-equipamentos-list',
  templateUrl: './equipamentos-list.component.html',
  imports: [
    CsDatePipe,
    CsCurrencyPipe,
    TableModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    EquipamentoFormDialogComponent,
  ],
})
export class EquipamentosListComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly facade = inject(EquipamentosFacade);
  readonly policy = inject(PatrimonioPermissionPolicy);

  readonly items = computed(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly formVisible = signal(false);
  readonly editing = signal<EquipamentoModel | null>(null);

  readonly canManage = computed(() => this.policy.canManageEquipamentos());

  ngOnInit(): void {
    this.facade.load();
  }

  statusTone(status: string): StatusTone {
    return statusEquipamentoTone(status);
  }

  goNew(): void {
    if (!this.canManage()) return;
    this.editing.set(null);
    this.formVisible.set(true);
  }

  goEdit(row: EquipamentoModel): void {
    if (!this.canManage()) return;
    this.editing.set(row);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }
}
