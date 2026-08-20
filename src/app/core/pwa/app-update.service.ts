import { inject, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

/**
 * Sem isso, o service worker (ver provideServiceWorker em app.config.ts) baixa uma versão nova em
 * segundo plano mas nunca a ativa - pelo ciclo de vida padrão de service worker, a versão antiga
 * continua no controle da aba até ela ser fechada de verdade e reaberta, então um F5 comum nunca
 * refletia um deploy novo (só um hard reload, que no Chrome ignora o service worker pra aquela
 * navegação - foi assim que o problema apareceu: "só atualiza com Ctrl+Shift+R").
 *
 * `activateUpdate()` chama skipWaiting() na versão nova, fazendo ela assumir o controle
 * imediatamente; só depois disso um reload passa a ser servido por ela.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate);

  init(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.swUpdate.activateUpdate().then(() => document.location.reload());
      });
  }
}
