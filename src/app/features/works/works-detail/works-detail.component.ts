import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressBarModule } from 'primeng/progressbar';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { WorksFacade } from '@features/facade/works.facade';
import { CsCurrencyPipe } from '@shared/pipes/cs-currency.pipe';
import { WorkModel } from '@models/works.models';
import { workStatusTone } from '@models/enums/work-status.enum';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { AddendumsListComponent } from '@features/works/addendums/addendums-list.component';
import { AddendumsPermissionPolicy } from '@features/works/addendums-permission.policy';
import { MeasurementsListComponent } from '@features/works/measurements/measurements-list.component';
import { MeasurementsPermissionPolicy } from '@features/works/measurements-permission.policy';
import { InstallmentsListComponent } from '@features/works/installments/installments-list.component';
import { InstallmentsPermissionPolicy } from '@features/works/installments-permission.policy';

/**
 * Tela de "Detalhes da Frente de Serviço" (works/:workId) - reúne num só lugar o que antes exigia
 * 3 navegações separadas a partir da listagem (Aditivos/Medições/Pagamentos, cada um com seu
 * próprio botão na coluna Ações). Objetivo: simplificar a coluna Ações da listagem (works-list),
 * que ficava com 5 ícones espremidos numa célula só.
 *
 * As 3 abas reaproveitam os componentes de lista já existentes (AddendumsListComponent/
 * MeasurementsListComponent/InstallmentsListComponent), em modo `embedded` (sem o page-header/
 * breadcrumb próprio de cada um - só o toolbar de ações) - nenhuma lógica de negócio duplicada,
 * cada aba continua se auto-carregando (facade.loadByWork) e resolvendo sua própria permissão.
 *
 * Cabeçalho fica com "Voltar" + "Atualizar" (pedido explícito do usuário, 2026-09-09) - "Editar"
 * continua acessível só pela listagem (works-list), sem duplicar aqui.
 */
@Component({
  standalone: true,
  selector: 'app-works-detail',
  templateUrl: './works-detail.component.html',
  styleUrl: './works-detail.component.scss',
  imports: [
    DecimalPipe,
    CsDatePipe,
    RouterLink,
    TabsModule,
    ButtonModule,
    CsCurrencyPipe,
    TooltipModule,
    TranslateModule,
    ProgressBarModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    AddendumsListComponent,
    MeasurementsListComponent,
    InstallmentsListComponent,
  ],
})
export class WorksDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly i18n = inject(I18nService);
  readonly facade = inject(WorksFacade);
  readonly addendumsPolicy = inject(AddendumsPermissionPolicy);
  readonly measurementsPolicy = inject(MeasurementsPermissionPolicy);
  readonly installmentsPolicy = inject(InstallmentsPermissionPolicy);

  readonly workId = signal('');
  readonly work = signal<WorkModel | null>(null);

  ngOnInit(): void {
    const workId = this.route.snapshot.paramMap.get('workId');
    if (!workId) {
      this.router.navigate(['/works']);
      return;
    }

    this.workId.set(workId);
    this.load();
  }

  private load(): void {
    this.facade
      .getById(this.workId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (work) => this.work.set(work),
        error: () => this.router.navigate(['/works']),
      });
  }

  refresh(): void {
    this.load();
  }

  /** Aba padrão: a primeira, entre Aditivos/Medições/Pagamentos, que o usuário de fato tem
   *  permissão de ver - evita abrir numa aba filtrada (sem tab correspondente visível) quando
   *  falta ADITIVO_CONSULT mas sobra MEDICAO_CONSULT/PARCELA_CONSULT, por exemplo. */
  defaultTab(): string {
    if (this.addendumsPolicy.canView()) return 'addendums';
    if (this.measurementsPolicy.canView()) return 'measurements';
    if (this.installmentsPolicy.canView()) return 'installments';
    return 'addendums';
  }

  tone(status: string): ReturnType<typeof workStatusTone> {
    return workStatusTone(status);
  }
}
