import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { map } from 'rxjs/operators';

import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { SessionExpiryModalComponent } from './shared/session-expiry-modal/session-expiry-modal.component';

/** Confirmação de logout (SidebarComponent#logout, @williamsilva/nimbus-web-commons) nunca passa
 *  `icon` explícito - preserva o visual de sempre quando nenhum outro `confirm()` estiver ativo. */
const DEFAULT_CONFIRM_ICON = 'pi pi-sign-out';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [
    CommonModule,
    ToastModule,
    ButtonModule,
    RouterOutlet,
    ConfirmDialogModule,
    SessionExpiryModalComponent,
  ],
})
export class App {
  private readonly confirmationService = inject(ConfirmationService);

  copiedCid = signal<string | null>(null);

  /** Ícone do <p-confirmDialog> global (app.html) - achado real 2026-09-11: o pTemplate="icon"
   *  antigo era fixo (sempre pi-sign-out), porque esse template do PrimeNG não recebe NENHUM
   *  contexto da confirmação atual (ver ConfirmDialog: `*ngTemplateOutlet="iconTemplate"` sem
   *  `context`, diferente do template de mensagem, que recebe `$implicit: confirmation`) - toda
   *  confirmação do app inteiro (excluir/ativar/inativar/etc.) mostrava o ícone de sair, ignorando
   *  o `icon` que cada tela pedia. Única forma de ler a confirmação ativa de dentro desse template
   *  é via requireConfirmation$ mesmo (não dá pra fazer isso dentro do próprio ConfirmDialog). */
  readonly confirmIcon = toSignal(
    this.confirmationService.requireConfirmation$.pipe(
      map((confirmation) => confirmation?.icon ?? DEFAULT_CONFIRM_ICON),
    ),
    { initialValue: DEFAULT_CONFIRM_ICON },
  );

  copyCid(cid: string) {
    try {
      void navigator.clipboard.writeText(cid);
      this.copiedCid.set(cid);
      window.setTimeout(() => {
        if (this.copiedCid() === cid) this.copiedCid.set(null);
      }, 1200);
    } catch {
      // ignore
    }
  }
}
