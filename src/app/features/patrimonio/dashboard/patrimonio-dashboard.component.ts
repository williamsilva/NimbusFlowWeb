import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { forkJoin } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { DateInputMaskDirective } from '@shared/directives/date-input-mask.directive';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { PatrimonioDashboardApiService } from '@features/service/patrimonio-dashboard.api.service';
import {
  ManutencoesPorStatusModel,
  TopEquipamentoModel,
  TotalEquipamentosModel,
  TotalManutencoesModel,
} from '@models/patrimonio-dashboard.models';

function toDateOnlyString(value: Date | null): string | null {
  if (!value) return null;
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

@Component({
  standalone: true,
  selector: 'app-patrimonio-dashboard',
  templateUrl: './patrimonio-dashboard.component.html',
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    CsCurrencyPipe,
    TranslateModule,
    FloatLabelModule,
    DatePickerModule,
    PageHeaderComponent,
    DateInputMaskDirective,
  ],
})
export class PatrimonioDashboardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(PatrimonioDashboardApiService);

  readonly i18n = inject(I18nService);

  readonly loading = signal(false);
  readonly firstPeriod = signal<Date | null>(null);
  readonly finalPeriod = signal<Date | null>(null);

  readonly totalEquipamentos = signal<TotalEquipamentosModel | null>(null);
  readonly totalManutencoes = signal<TotalManutencoesModel | null>(null);
  readonly topEquipamentos = signal<TopEquipamentoModel[]>([]);
  readonly manutencoesPorStatus = signal<ManutencoesPorStatusModel[]>([]);

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    const firstPeriod = toDateOnlyString(this.firstPeriod());
    const finalPeriod = toDateOnlyString(this.finalPeriod());

    this.loading.set(true);
    forkJoin({
      totalEquipamentos: this.api.totalEquipamentos(firstPeriod, finalPeriod),
      totalManutencoes: this.api.totalManutencoes(firstPeriod, finalPeriod),
      topEquipamentos: this.api.topEquipamentos(firstPeriod, finalPeriod),
      manutencoesPorStatus: this.api.manutencoesPorStatus(firstPeriod, finalPeriod),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.totalEquipamentos.set(res.totalEquipamentos);
          this.totalManutencoes.set(res.totalManutencoes);
          this.topEquipamentos.set(res.topEquipamentos ?? []);
          this.manutencoesPorStatus.set(res.manutencoesPorStatus ?? []);
        },
        error: () => this.loading.set(false),
      });
  }

  clear(): void {
    this.firstPeriod.set(null);
    this.finalPeriod.set(null);
    this.search();
  }
}
