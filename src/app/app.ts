import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Component, signal } from '@angular/core';

import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { SessionExpiryModalComponent } from './shared/session-expiry-modal/session-expiry-modal.component';

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
  copiedCid = signal<string | null>(null);

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
