import { Component, ElementRef, EventEmitter, Output, ViewChild, AfterViewInit, input } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Assinatura desenhada (pedido do usuário 2026-09-23, tela de execução) - canvas nativo, sem
 * biblioteca externa (nenhuma lib tipo signature_pad estava instalada em nenhum app do
 * workspace, ver investigação prévia). Exporta como PNG (File) pra reaproveitar o MESMO fluxo de
 * upload multipart já usado por foto/documento (TasksApiService#answerActivity).
 */
@Component({
  standalone: true,
  selector: 'app-signature-pad',
  imports: [ButtonModule, TranslateModule],
  template: `
    <div class="cs-signature-pad">
      <span class="cs-signature-hint">{{ 'tasks.execution.signatureHint' | translate }}</span>
      <canvas
        #canvas
        width="500"
        height="180"
        class="cs-signature-canvas"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp()"
        (pointerleave)="onPointerUp()"
      ></canvas>
      <button
        pButton
        type="button"
        icon="pi pi-refresh"
        (click)="clear()"
        [disabled]="disabled()"
        class="p-button-text p-button-sm"
        [label]="'tasks.execution.signatureClear' | translate"
      ></button>
    </div>
  `,
  styles: [
    `
      .cs-signature-pad {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.4rem;
      }

      .cs-signature-hint {
        font-size: 0.8rem;
        opacity: 0.65;
      }

      /* Fundo sempre branco (mesmo no tema escuro) - a tinta do traço é fixa em #1f2937
         (ver ngAfterViewInit), então o campo precisa continuar claro pra ficar legível,
         igual uma folha de assinatura de verdade. Só a borda muda com o tema. */
      .cs-signature-canvas {
        width: 100%;
        max-width: 500px;
        height: 180px;
        touch-action: none;
        cursor: crosshair;
        border-radius: 8px;
        background: #fff;
        border: 1px solid #cbd5e1;
      }

      /* :host-context(.dark), não :root.dark - View Encapsulation prefixa :root.dark e ele nunca
         casa com nada dentro de um *.component.ts (ver memória project_root_dark_encapsulation_bug). */
      :host-context(.dark) .cs-signature-canvas {
        border-color: rgba(255, 255, 255, 0.35);
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4);
      }
    `,
  ],
})
export class SignaturePadComponent implements AfterViewInit {
  disabled = input(false);

  @Output() readonly changed = new EventEmitter<boolean>();
  @ViewChild('canvas', { static: true }) private canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private hasContent = false;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    this.ctx = ctx;
  }

  onPointerDown(event: PointerEvent): void {
    if (this.disabled()) return;
    this.drawing = true;
    const { x, y } = this.relativeCoords(event);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.drawing || this.disabled()) return;
    const { x, y } = this.relativeCoords(event);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    if (!this.hasContent) {
      this.hasContent = true;
      this.changed.emit(true);
    }
  }

  onPointerUp(): void {
    this.drawing = false;
  }

  clear(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.hasContent = false;
    this.changed.emit(false);
  }

  hasSignature(): boolean {
    return this.hasContent;
  }

  private relativeCoords(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  /** Exporta o desenho como PNG (pedido do usuário 2026-09-23) - nulo quando o canvas está
   *  vazio. */
  toFile(): Promise<File | null> {
    return new Promise((resolve) => {
      if (!this.hasContent) {
        resolve(null);
        return;
      }
      this.canvasRef.nativeElement.toBlob((blob) => {
        resolve(blob ? new File([blob], `assinatura-${Date.now()}.png`, { type: 'image/png' }) : null);
      }, 'image/png');
    });
  }
}
