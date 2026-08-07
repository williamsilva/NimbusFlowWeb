import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface NbPageBreadcrumbItem {
  label: string;
  url?: string;
}

/**
 * Cabecalho de tela (breadcrumb + titulo/subtitulo + acoes projetadas) - mesmo papel do
 * cs-page-header do CardSyncWeb, reaproveitado por todas as telas de lista. Sem CSS propria: usa
 * só utilitarios do PrimeFlex, igual ao componente original (o tema/tipografia vem do global).
 */
@Component({
  standalone: true,
  selector: 'nb-page-header',
  templateUrl: './nb-page-header.component.html',
  imports: [RouterLink],
})
export class NbPageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() breadcrumb: NbPageBreadcrumbItem[] = [];
  @Input() compact = false;

  hasBreadcrumb(): boolean {
    return !!this.breadcrumb?.length;
  }
}
