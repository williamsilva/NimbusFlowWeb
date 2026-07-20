import { Component, Input } from '@angular/core';

export type StatusTone = 'success' | 'info' | 'warn' | 'danger' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="status-badge" [class]="'status-badge--' + tone">{{ label }}</span>`,
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() tone: StatusTone = 'neutral';
}
