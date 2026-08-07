
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

export interface ListDialogData {
  title: string;
  subtitle?: string;
  items: string[];
}

/**
 * Dialog genérico pra listar itens com badge numerado - usado em "Minha conta" pros modais de
 * Grupos/Permissões (mesmo padrão visual do CardSyncWeb). Ainda em MatDialog - migração pra
 * p-dialog fica pra fase de telas de feature (account), junto com o resto do módulo. title/subtitle
 * já chegam traduzidos via I18nService.tUi(), os itens em si (grupos/permissões) são códigos
 * brutos, não chaves de i18n.
 */
@Component({
    selector: 'app-list-dialog',
    imports: [MatButtonModule, MatDialogModule, MatIconModule, TranslatePipe],
    templateUrl: './list-dialog.component.html',
    styleUrl: './list-dialog.component.scss'
})
export class ListDialogComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<ListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: ListDialogData,
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
