import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TabsModule } from 'primeng/tabs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { PwaEnvironmentService } from '@core/pwa/pwa-environment.service';
import { TicketsFacade } from '@features/facade/tickets.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { TicketsPermissionPolicy } from '@features/tickets/tickets-permission.policy';
import { TicketsEditDialogComponent } from '@features/tickets/tickets-edit/tickets-edit-dialog.component';
import { TicketsCloseDialogComponent } from '@features/tickets/tickets-close/tickets-close-dialog.component';
import { CompanySettingsApiService } from '@features/service/company-settings.api.service';
import { CompanySettingsModel } from '@models/company-settings.models';
import { ticketStatusTone, TicketStatusEnum } from '@models/enums/ticket-status.enum';
import { ticketPriorityTone } from '@models/enums/ticket-priority.enum';
import { TicketModel, TicketCommentModel, formatTicketNumero } from '@models/tickets.models';

/**
 * Tela de "Detalhes do Chamado" (/tickets/:id) - referência visual trazida pelo usuário
 * (2026-09-19): no celular vira 2 abas (Conteúdo/Comentários, `p-tabs`), no PC as 2 seções ficam
 * juntas na mesma tela (sem abas) - "2 telas de PC" = lista + este detalhe único. Mesmo padrão
 * estrutural de WorksDetailComponent (rota própria, reaproveitando diálogos já existentes em vez
 * de duplicar lógica).
 *
 * <p>Ações portadas pra cá nesta entrega: Editar, Iniciar atendimento, Concluir, Cancelar -
 * Converter em plano de ação/Abrir Frente de Serviço/Desfazer Frente continuam só na lista por
 * enquanto (mesmo escopo já grande desta entrega).
 */
@Component({
  standalone: true,
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss',
  imports: [
    CsDatePipe,
    RouterLink,
    FormsModule,
    TabsModule,
    ButtonModule,
    TooltipModule,
    TextareaModule,
    TranslateModule,
    NgTemplateOutlet,
    PageHeaderComponent,
    StatusBadgeComponent,
    TicketsEditDialogComponent,
    TicketsCloseDialogComponent,
  ],
})
export class TicketDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(MessageService);
  private readonly companySettingsApi = inject(CompanySettingsApiService);

  readonly i18n = inject(I18nService);
  readonly facade = inject(TicketsFacade);
  readonly policy = inject(TicketsPermissionPolicy);
  readonly pwa = inject(PwaEnvironmentService);

  readonly ticketId = signal('');
  readonly ticket = signal<TicketModel | null>(null);
  readonly company = signal<CompanySettingsModel | null>(null);
  readonly comments = signal<TicketCommentModel[]>([]);
  readonly loadingComments = signal(false);

  readonly editVisible = signal(false);
  readonly closeVisible = signal(false);
  readonly starting = signal(false);

  readonly activeTab = signal<'content' | 'comments'>('content');

  readonly commentMessage = signal('');
  readonly commentFiles = signal<File[]>([]);
  readonly sendingComment = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/tickets']);
      return;
    }

    this.ticketId.set(id);
    this.load();
    this.loadComments();
    this.companySettingsApi
      .getDisplaySettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (c) => this.company.set(c) });
  }

  private load(): void {
    this.facade
      .getById(this.ticketId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (t) => this.ticket.set(t),
        error: () => this.router.navigate(['/tickets']),
      });
  }

  refresh(): void {
    this.load();
  }

  loadComments(): void {
    this.loadingComments.set(true);
    this.facade
      .getComments(this.ticketId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comments) => {
          this.comments.set(comments);
          this.loadingComments.set(false);
        },
        error: () => this.loadingComments.set(false),
      });
  }

  /** Só sincroniza no momento do render (mesma técnica já usada por LayoutStateService) - sem
   *  listener de resize dedicado, redimensionar a janela só reflete no próximo ciclo de change
   *  detection (comportamento aceito já usado no resto do app). */
  isMobile(): boolean {
    return this.pwa.isMobileViewport();
  }

  tone(status: string): ReturnType<typeof ticketStatusTone> {
    return ticketStatusTone(status);
  }

  priorityTone(priority: string): ReturnType<typeof ticketPriorityTone> {
    return ticketPriorityTone(priority);
  }

  formatNumero(numero: number): string {
    return formatTicketNumero(numero);
  }

  /** attachmentUrl (anexo da criação) e closePhotos (evidência do fechamento) não guardam
   *  contentType - só o path pré-assinado - então infere pela extensão do arquivo. Evidência
   *  fotográfica é sempre imagem por regra de negócio (upload restrito a image/* no diálogo de
   *  fechamento, ver TicketsCloseDialogComponent), mas a checagem é mantida por defesa em
   *  profundidade. Anexo de comentário já guarda contentType de verdade - ver
   *  isImageContentType abaixo, não usa esta regex. */
  private static readonly IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i;

  isImageAttachment(url: string | null): boolean {
    return !!url && TicketDetailComponent.IMAGE_EXTENSIONS.test(url);
  }

  /** Anexo de comentário aceita qualquer tipo de arquivo (não só foto, ver
   *  TicketCommentService#create) - diferente do anexo da criação/evidência do fechamento, aqui
   *  dá pra confiar no contentType de verdade (pedido do usuário 2026-09-21: mostrar as imagens
   *  de comentário/fechamento na consulta do chamado, não só o nome do arquivo). */
  isImageContentType(contentType: string | null | undefined): boolean {
    return !!contentType && contentType.startsWith('image/');
  }

  goBack(): void {
    this.router.navigate(['/tickets']);
  }

  private isOpenLike(status: TicketStatusEnum): boolean {
    return status === TicketStatusEnum.OPEN || status === TicketStatusEnum.IN_PROGRESS;
  }

  /** Mesma elegibilidade de EDITABLE_STATUSES no backend. CHAMADO_EDIT dedicada, não
   *  CHAMADO_MANAGE (pedido do usuário 2026-09-20, mesmo padrão de CHAMADO_CANCEL: grupo
   *  Operacional tem CHAMADO_MANAGE mas não deve poder editar). */
  canEdit(): boolean {
    const t = this.ticket();
    return !!t && this.policy.canEdit() && t.workId == null && this.isOpenLike(t.status);
  }

  canStart(): boolean {
    const t = this.ticket();
    return !!t && this.policy.canManage() && t.workId == null && t.status === TicketStatusEnum.OPEN;
  }

  /** Achado real 2026-09-21, pedido do usuário: fechar (e comentar, ver canComment abaixo) exige
   *  atendimento iniciado - OPEN sozinho não basta mais (mesma regra nova de
   *  TicketService.COMMENTABLE_AND_CLOSABLE_STATUSES no backend). CONVERTED_TO_ACTION_PLAN
   *  continua elegível porque só se chega lá vindo de IN_PROGRESS. */
  canClose(): boolean {
    const t = this.ticket();
    return (
      !!t &&
      this.policy.canManage() &&
      t.workId == null &&
      (t.status === TicketStatusEnum.IN_PROGRESS || t.status === TicketStatusEnum.CONVERTED_TO_ACTION_PLAN)
    );
  }

  /** Mesma elegibilidade de status de canClose (ver TicketService.requireCommentable no backend)
   *  - achado real 2026-09-21, pedido do usuário: comentar também exige atendimento iniciado. */
  canComment(): boolean {
    const t = this.ticket();
    return (
      !!t &&
      this.policy.canManage() &&
      (t.status === TicketStatusEnum.IN_PROGRESS || t.status === TicketStatusEnum.CONVERTED_TO_ACTION_PLAN)
    );
  }

  goEdit(): void {
    if (!this.canEdit()) return;
    this.editVisible.set(true);
  }

  onEditVisibleChange(v: boolean): void {
    this.editVisible.set(v);
  }

  onUpdated(): void {
    this.refresh();
  }

  goStart(): void {
    if (!this.canStart() || this.starting()) return;

    this.starting.set(true);
    this.facade
      .start(this.ticketId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.starting.set(false);
          this.refresh();
        },
        error: () => {
          this.starting.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tickets.action.startError' as never),
          });
        },
      });
  }

  goClose(): void {
    if (!this.canClose()) return;
    this.closeVisible.set(true);
  }

  onCloseVisibleChange(v: boolean): void {
    this.closeVisible.set(v);
  }

  onClosed(): void {
    this.refresh();
  }

  onCommentFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.commentFiles.set(input.files ? Array.from(input.files) : []);
  }

  removeCommentFile(index: number): void {
    this.commentFiles.update((files) => files.filter((_, i) => i !== index));
  }

  sendComment(): void {
    const message = this.commentMessage().trim();
    if (!message || this.sendingComment()) return;

    this.sendingComment.set(true);
    this.facade
      .createComment(this.ticketId(), { message, files: this.commentFiles() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sendingComment.set(false);
          this.commentMessage.set('');
          this.commentFiles.set([]);
          this.loadComments();
        },
        error: () => {
          this.sendingComment.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tickets.comments.saveError' as never),
          });
        },
      });
  }
}
