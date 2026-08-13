import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';

import { firstValueFrom } from 'rxjs';

import { API } from '../api/api.config';
import { environment } from '../../../environments/environment';

/**
 * Envolve o SwPush do Angular (service worker já registrado na Fase B/PWA, ver app.config.ts) -
 * opt-in explícito de push notification por dispositivo/navegador, persistido no backend
 * (com.nimbusflow.common.notification.push.PushSubscriptionController). Nunca solicita
 * permissão de notificação sozinho ao subir o app - só quando o usuário clica no botão de
 * opt-in na tela de perfil (prática padrão de PWA, evita o diálogo nativo aparecer sem
 * contexto).
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly swPush = inject(SwPush);
  private readonly http = inject(HttpClient);

  /** false em navegador sem suporte a Service Worker/Push, ou em dev (provideServiceWorker fica
   *  desabilitado com isDevMode() - ver app.config.ts) - o botão de opt-in no perfil some nesse
   *  caso em vez de falhar silenciosamente ao clicar. */
  get isSupported(): boolean {
    return this.swPush.isEnabled;
  }

  /** Assinatura ativa do dispositivo/navegador atual, se já tiver opt-in feito antes (o browser
   *  persiste isso, sobrevive a reload) - usado só pra decidir o estado inicial do botão de
   *  opt-in no perfil. */
  async currentSubscription(): Promise<PushSubscription | null> {
    if (!this.isSupported) {
      return null;
    }
    return firstValueFrom(this.swPush.subscription);
  }

  /** Pede permissão de notificação ao navegador (diálogo nativo), assina no push service do
   *  browser e envia a subscription pro backend (upsert por endpoint, ver
   *  PushNotificationService.subscribe no NimbusFlowServer). */
  async subscribe(): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Push notifications não suportadas neste navegador/contexto');
    }

    const subscription = await this.swPush.requestSubscription({
      serverPublicKey: environment.vapidPublicKey,
    });

    await firstValueFrom(this.http.post(`${API.bff}/v1/push/subscriptions`, subscription.toJSON()));
  }

  /** Cancela a assinatura no navegador E remove do backend (por endpoint - um usuário pode ter
   *  outras subscriptions em outros dispositivos, só a deste navegador sai). */
  async unsubscribe(): Promise<void> {
    if (!this.isSupported) {
      return;
    }

    const subscription = await this.currentSubscription();
    if (!subscription) {
      return;
    }

    await this.swPush.unsubscribe();
    await firstValueFrom(
      this.http.delete(`${API.bff}/v1/push/subscriptions`, {
        params: { endpoint: subscription.endpoint },
      }),
    );
  }
}
