import { Injectable } from '@angular/core';

/** Mesmo corte de largura já usado em layout-state.service.ts/layout.component.ts pra decidir o
 *  layout mobile (cards) - aqui só pra decidir se o dispositivo é um celular, não um layout. */
const MOBILE_MAX_WIDTH = 768;

/**
 * Detecta se o app está rodando instalado (modo standalone, "Adicionar à tela de início"/"Instalar
 * app") num celular - usado pra decidir se a câmera (capture="environment") faz sentido oferecer
 * numa tela (ex.: TicketsCloseDialogComponent): no computador (instalado ou não) só faz sentido
 * upload de arquivo, câmera é só quando o app está mesmo instalado no celular.
 */
@Injectable({ providedIn: 'root' })
export class PwaEnvironmentService {
  /** display-mode:standalone cobre Android/desktop Chrome instalado; navigator.standalone cobre
   *  iOS Safari (não suporta a media query, expõe essa propriedade não-padrão em vez disso). */
  isStandalone(): boolean {
    const standaloneMediaQuery =
      typeof window !== 'undefined' && 'matchMedia' in window
        ? window.matchMedia('(display-mode: standalone)').matches
        : false;
    const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
    return standaloneMediaQuery || iosStandalone;
  }

  isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX_WIDTH;
  }

  /** Só true quando instalado E num celular - desktop instalado como PWA ainda cai em false.
   *  Mesmo gate usado pra decidir features "de app" (câmera, opt-in de push no perfil - ver
   *  ProfilePageComponent) que não fazem sentido oferecer no navegador comum. */
  isInstalledMobileApp(): boolean {
    return this.isStandalone() && this.isMobileViewport();
  }

  canUseCamera(): boolean {
    return this.isInstalledMobileApp();
  }
}
