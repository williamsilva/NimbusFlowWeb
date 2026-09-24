import { Component, EventEmitter, Output, inject, input } from '@angular/core';

import { DialogModule } from 'primeng/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';

/** "O que você deseja fazer?" (pedido do usuário 2026-09-24, print de referência) - primeiro
 *  passo do "+ Nova Tarefa" (AllTasksListComponent/TasksKanbanBoardComponent): escolher entre
 *  "Criar tarefa em branco" (abre TasksCreateDialogComponent normal) ou "Criar a partir de um
 *  modelo" (abre TaskTemplatePickerDialogComponent primeiro). Sem formulário - só 2 cards. */
@Component({
  standalone: true,
  selector: 'app-task-creation-choice-dialog',
  templateUrl: './task-creation-choice-dialog.component.html',
  styleUrl: './task-creation-choice-dialog.component.scss',
  imports: [DialogModule, TranslateModule],
})
export class TaskCreationChoiceDialogComponent {
  visible = input.required<boolean>();

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() chooseBlank = new EventEmitter<void>();
  @Output() chooseFromTemplate = new EventEmitter<void>();

  readonly i18n = inject(I18nService);

  /** Escolha pendente, só emitida em #onHide (depois que a animação de fechar este diálogo
   *  termina de verdade) - pedido do usuário 2026-09-24: abrir o próximo diálogo (picker) NA
   *  MESMA hora em que este ainda está fechando deixava os p-select do próximo diálogo
   *  cascateando os dados certos (categoria->subcategoria->modelo buscavam certo) mas sem refletir
   *  a seleção visualmente - dois p-dialog concorrendo pela mesma transição/overlay do PrimeNG.
   *  Emitir só depois do onHide evita a sobreposição. */
  private pendingChoice: 'blank' | 'template' | null = null;

  close(): void {
    this.visibleChange.emit(false);
  }

  onHide(): void {
    this.close();
    const choice = this.pendingChoice;
    this.pendingChoice = null;
    if (choice === 'blank') {
      this.chooseBlank.emit();
    } else if (choice === 'template') {
      this.chooseFromTemplate.emit();
    }
  }

  selectBlank(): void {
    this.pendingChoice = 'blank';
    this.close();
  }

  selectFromTemplate(): void {
    this.pendingChoice = 'template';
    this.close();
  }
}
