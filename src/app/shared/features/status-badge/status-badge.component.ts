import { Component, Input } from '@angular/core';

export type StatusTone = 'success' | 'info' | 'warn' | 'danger' | 'neutral';

/** Mesmo componente/estilo do NimbusFlowWeb original (app-status-badge), com o prefixo `cs-`
 *  usado pelos demais componentes visuais compartilhados desta tela (cs-page-header, etc.). */
@Component({
  selector: 'cs-status-badge',
  standalone: true,
  template: `<span class="status-badge" [class]="'status-badge--' + tone">{{ label }}</span>`,
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() tone: StatusTone = 'neutral';
}
