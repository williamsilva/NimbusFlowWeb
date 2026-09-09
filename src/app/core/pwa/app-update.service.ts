import { ApplicationRef, inject, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { concat, filter, first, interval } from 'rxjs';

/**
 * Sem isso, o service worker (ver provideServiceWorker em app.config.ts) baixa uma versão nova em
 * segundo plano mas nunca a ativa - pelo ciclo de vida padrão de service worker, a versão antiga
 * continua no controle da aba até ela ser fechada de verdade e reaberta, então um F5 comum nunca
 * refletia um deploy novo (só um hard reload, que no Chrome ignora o service worker pra aquela
 * navegação - foi assim que o problema apareceu: "só atualiza com Ctrl+Shift+R").
 *
 * `activateUpdate()` chama skipWaiting() na versão nova, fazendo ela assumir o controle
 * imediatamente; só depois disso um reload passa a ser servido por ela.
 *
 * Faltava a outra metade do problema (achado real 2026-09-09, "não está fazendo o reload quando o
 * projeto é deployado"): `versionUpdates` só emite VERSION_READY depois de uma checagem contra o
 * ngsw.json do servidor, e o Angular só faz essa checagem sozinho no registro inicial do SW (ver
 * registrationStrategy) - numa aba de SPA que fica aberta o dia inteiro (sem navegação completa
 * nova, sem F5), essa checagem nunca mais roda de novo por conta própria, então um deploy feito
 * enquanto a aba já estava aberta nunca era percebido. `checkForUpdate()` força essa checagem -
 * chamado uma vez assim que o app estabiliza (cobre quem já tinha a aba aberta há pouco) e depois
 * a cada 15 minutos (cobre quem deixa a aba aberta o dia todo).
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly appRef = inject(ApplicationRef);

  private static readonly CHECK_INTERVAL_MS = 15 * 60 * 1000;

  init(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.swUpdate.activateUpdate().then(() => document.location.reload());
      });

    const appIsStable$ = this.appRef.isStable.pipe(first((isStable) => isStable));
    const everyInterval$ = interval(AppUpdateService.CHECK_INTERVAL_MS);
    concat(appIsStable$, everyInterval$).subscribe(() => {
      // best-effort - falha de rede (ex.: aba offline no momento da checagem) não deveria gerar
      // unhandled rejection no console, só tentar de novo no próximo intervalo.
      this.swUpdate.checkForUpdate().catch(() => undefined);
    });
  }
}
