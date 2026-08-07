import { Component } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TranslatePipe } from '@ngx-translate/core';

export interface ListDialogData {
  title: string;
  subtitle?: string;
  items: string[];
}

/**
 * Dialog genérico pra listar itens com badge numerado - usado em "Minha conta" pros modais de
 * Grupos/Permissões (mesmo padrão visual do CardSyncWeb). O título vai no header do
 * DialogService.open() (o botão de fechar já vem de fábrica no p-dialog do DynamicDialog, sem
 * precisar de close() nem de um header próprio aqui). title/subtitle já chegam traduzidos via
 * I18nService.tUi(), os itens em si (grupos/permissões) são códigos brutos, não chaves de i18n.
 */
@Component({
    selector: 'app-list-dialog',
    imports: [TranslatePipe],
    templateUrl: './list-dialog.component.html',
    styleUrl: './list-dialog.component.scss'
})
export class ListDialogComponent {
  readonly data: ListDialogData;

  constructor(config: DynamicDialogConfig<ListDialogData>) {
    this.data = config.data!;
  }
}
