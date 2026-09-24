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

  close(): void {
    this.visibleChange.emit(false);
  }

  onHide(): void {
    this.close();
  }

  selectBlank(): void {
    this.chooseBlank.emit();
    this.close();
  }

  selectFromTemplate(): void {
    this.chooseFromTemplate.emit();
    this.close();
  }
}
