import { Component, ElementRef, input, output, viewChild } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

/**
 * Planta/imagem do empreendimento (Project.siteplanUrl) com um pin clicável - marca um ponto
 * relativo (x/y, 0-100%) na imagem, sem GPS/PostGIS (ver Work.planPositionX/Y e
 * Measurement.planPositionX/Y no backend). Reutilizado tanto no formulário de Frente de Serviço
 * quanto no de Medição.
 *
 * v1 sem zoom/pan - clicar de novo já reposiciona o pin.
 */
@Component({
  standalone: true,
  selector: 'cs-site-plan-picker',
  templateUrl: './site-plan-picker.component.html',
  styleUrl: './site-plan-picker.component.scss',
  imports: [TranslateModule],
})
export class SitePlanPickerComponent {
  imageUrl = input<string | null>(null);
  x = input<number | null>(null);
  y = input<number | null>(null);
  readonly = input(false);

  positionChange = output<{ x: number; y: number }>();

  private readonly container = viewChild<ElementRef<HTMLDivElement>>('container');

  hasPin(): boolean {
    return this.x() != null && this.y() != null;
  }

  onImageClick(event: MouseEvent): void {
    if (this.readonly()) return;

    const el = this.container()?.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const xPercent = clamp(((event.clientX - rect.left) / rect.width) * 100);
    const yPercent = clamp(((event.clientY - rect.top) / rect.height) * 100);

    this.positionChange.emit({ x: round2(xPercent), y: round2(yPercent) });
  }
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
