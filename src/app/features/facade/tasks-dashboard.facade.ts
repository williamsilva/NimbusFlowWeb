import { Injectable, inject, signal } from '@angular/core';

import { forkJoin, of } from 'rxjs';

import { TasksDashboardApiService } from '@features/service/tasks-dashboard.api.service';
import { EmployeeTaskRankingModel, TaskDurationAnalysisModel, TeamTaskProgressModel } from '@models/dashboard.models';

/** Dashboard de Tarefas - herda employeeTaskRanking/teamTaskProgress do antigo DashboardFacade
 *  (pedido do usuário 2026-09-21, separação dos dashboards). loadEmployeeRanking continua
 *  condicional (não fixo em true) mesmo dentro desta página já gated por TAREFA_CONSULT/EXECUTE
 *  na rota: DASHBOARD_RANKING_CONSULT (só ADMINISTRADOR) é mais restrita - sem essa distinção, um
 *  colaborador comum receberia 403 no ranking nominal e o forkJoin inteiro falharia. */
@Injectable({ providedIn: 'root' })
export class TasksDashboardFacade {
  private readonly api = inject(TasksDashboardApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _employeeTaskRanking = signal<EmployeeTaskRankingModel[]>([]);
  private readonly _teamTaskProgress = signal<TeamTaskProgressModel | null>(null);
  private readonly _durationAnalysis = signal<TaskDurationAnalysisModel | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly employeeTaskRanking = this._employeeTaskRanking.asReadonly();
  readonly teamTaskProgress = this._teamTaskProgress.asReadonly();
  readonly durationAnalysis = this._durationAnalysis.asReadonly();

  load(loadEmployeeRanking: boolean): void {
    this._loading.set(true);

    forkJoin({
      employeeTaskRanking: loadEmployeeRanking ? this.api.employeeTaskRanking() : of([]),
      teamTaskProgress: this.api.teamTaskProgress(),
      durationAnalysis: this.api.taskDurationAnalysis(),
    }).subscribe({
      next: ({ employeeTaskRanking, teamTaskProgress, durationAnalysis }) => {
        this._employeeTaskRanking.set(employeeTaskRanking);
        this._teamTaskProgress.set(teamTaskProgress);
        this._durationAnalysis.set(durationAnalysis);
        this._loading.set(false);
        this._loadedOnce.set(true);
      },
      error: () => {
        this._loading.set(false);
        this._loadedOnce.set(true);
      },
    });
  }
}
