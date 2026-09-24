import { Injectable, inject, signal } from '@angular/core';

import { TaskShiftSettingsApiService } from '@features/service/task-shift-settings.api.service';
import { TaskShiftSettingsModel } from '@models/task-shift-settings.models';

/** Cache em memória do horário dos Turnos (pedido do usuário 2026-09-24, mostrar a hora onde já
 *  se mostra o Turno - Kanban/execução) - muda raramente, não precisa buscar de novo a cada
 *  cartão/tarefa exibida na tela. */
@Injectable({ providedIn: 'root' })
export class TaskShiftSettingsFacade {
  private readonly api = inject(TaskShiftSettingsApiService);

  private readonly _settings = signal<TaskShiftSettingsModel | null>(null);
  private readonly _loadedOnce = signal(false);

  readonly settings = this._settings.asReadonly();

  load(force = false): void {
    if (!force && this._loadedOnce()) return;

    this.api.getSettings().subscribe({
      next: (s) => {
        this._settings.set(s);
        this._loadedOnce.set(true);
      },
      error: () => this._loadedOnce.set(true),
    });
  }
}
