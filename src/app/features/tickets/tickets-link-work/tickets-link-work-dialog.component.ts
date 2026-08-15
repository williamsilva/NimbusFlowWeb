import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { input, signal, Output, inject, computed, Component, EventEmitter, effect } from '@angular/core';

import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { WorksFacade } from '@features/facade/works.facade';
import { TicketsFacade } from '@features/facade/tickets.facade';
import { WorkStatusEnum } from '@models/enums/work-status.enum';

/**
 * "Abrir Frente de Serviço" a partir de um chamado já criado - o usuário escolhe entre vincular a
 * uma Frente já existente (aqui mesmo) ou criar uma nova (emite `createNewRequested`, fecha este
 * dialog - quem cria a Frente de verdade é TicketsListComponent, reaproveitando
 * WorksCreateDialogComponent já existente; o vínculo em si acontece depois, quando aquele dialog
 * emite o WorkModel recém-criado).
 */
@Component({
  standalone: true,
  selector: 'app-tickets-link-work-dialog',
  templateUrl: './tickets-link-work-dialog.component.html',
  imports: [
    ToastModule,
    FormsModule,
    SelectModule,
    DialogModule,
    ButtonModule,
    TranslateModule,
    FloatLabelModule,
  ],
})
export class TicketsLinkWorkDialogComponent {
  visible = input.required<boolean>();
  ticketId = input<string | null>(null);

  @Output() linked = new EventEmitter<void>();
  @Output() createNewRequested = new EventEmitter<void>();
  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  /** Só Frentes ainda em execução aceitam um novo vínculo de chamado - o backend (TicketService#
   *  linkWork) valida de novo o mesmo recorte, este filtro aqui é só pra não oferecer no seletor
   *  uma Frente já concluída/cancelada. */
  private static readonly ELIGIBLE_STATUSES = new Set<WorkStatusEnum>([
    WorkStatusEnum.PLANNED,
    WorkStatusEnum.IN_PROGRESS,
    WorkStatusEnum.PAUSED,
  ]);

  readonly i18n = inject(I18nService);
  readonly tickets = inject(TicketsFacade);
  readonly worksFacade = inject(WorksFacade);
  readonly workOptions = computed(() =>
    this.worksFacade
      .options()
      .filter((w) => TicketsLinkWorkDialogComponent.ELIGIBLE_STATUSES.has(w.status)),
  );

  readonly saving = signal(false);
  readonly selectedWorkId = signal<string | null>(null);

  constructor() {
    this.worksFacade.loadOptions();

    effect(() => {
      if (this.visible()) {
        return;
      }
      this.saving.set(false);
      this.selectedWorkId.set(null);
    });
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.selectedWorkId.set(null);
    this.visibleChange.emit(false);
  }

  goCreateNew(): void {
    this.createNewRequested.emit();
    this.close();
  }

  link(): void {
    const ticketId = this.ticketId();
    const workId = this.selectedWorkId();
    if (!ticketId || !workId) return;

    this.saving.set(true);

    this.tickets
      .linkWork(ticketId, { workId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);

          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tickets.action.workLinked' as never),
          });

          this.linked.emit();
          this.close();
        },
        error: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tickets.action.workLinkError' as never),
          });
        },
      });
  }
}
