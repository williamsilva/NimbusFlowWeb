import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';

import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { EmailLogFacade } from '@features/facade/email-log.facade';
import { StatefulListPage } from '@features/list-base/stateful-list-page';
import { EmailLogAdvancedFilters } from '@features/filter/email-log.filters';
import { buildListQuery } from '@shared/features/list-query/list-query.builder';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { EmailLogModel, EmailLogFiltersState } from '@models/email-log.models';
import { PeriodEnum, allPeriodEnum, periodEnumLabel } from '@models/enums/period.enum';
import { CsAdvancedPeriodDateFilterComponent } from '@features/list-base/cs-advanced-period-date-filter.component';
import {
  ActiveFilterItem,
  FiltersPanelComponent,
} from '@shared/features/filters-panel/filters-panel.component';
import {
  readSingleFilterValue,
  readArrayFilterValues,
  readDateRangeFilterValue,
} from '@features/list-base/table-filter-readers';
import {
  EmailLogStatusEnum,
  emailLogStatusTone,
  EMAIL_LOG_STATUS_VALUES,
} from '@models/enums/email-log-status.enum';
import {
  EMAIL_LOG_EVENT_TYPE_VALUES,
  emailLogEventTypeI18nKey,
} from '@models/enums/email-log-event-type.enum';

/** Menu "Configurações > Auditoria de E-mail" - só leitura (sem reenvio/edição, ver
 *  BffEmailLogController no backend). Mesmo padrão StatefulListPage + cs-filters-panel das demais
 *  listagens globais (ex.: AllAddendumsListComponent), sem nenhuma ação de escrita por linha - só
 *  "ver detalhes" (abre o corpo do e-mail renderizado). */
@Component({
  standalone: true,
  selector: 'app-email-log-list',
  templateUrl: './email-log-list.component.html',
  imports: [
    FloatLabel,
    CsDatePipe,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    TooltipModule,
    InputTextModule,
    TranslateModule,
    DatePickerModule,
    MultiSelectModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    FiltersPanelComponent,
    CsAdvancedPeriodDateFilterComponent,
  ],
})
export class EmailLogListComponent extends StatefulListPage<
  EmailLogFiltersState,
  EmailLogAdvancedFilters
> {
  @ViewChild('dt') private dt?: Table;

  protected override readonly i18n = inject(I18nService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly facade = inject(EmailLogFacade);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  recipients = signal('');
  subject = signal('');
  status = signal<string[] | null>(null);
  eventType = signal<string[] | null>(null);
  sentAt = signal<string | string[] | null>(null);
  periodSentAt = signal<PeriodEnum | null>(null);

  readonly detailVisible = signal(false);
  readonly detailRow = signal<EmailLogModel | null>(null);

  readonly periodEnumOptions = computed(() => {
    this.i18n.getAppliedLang();
    return allPeriodEnum().map((value) => ({ label: periodEnumLabel(value, this.i18n), value }));
  });

  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly items = computed<EmailLogModel[]>(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly statusOptions = computed(() => {
    this.i18n.getAppliedLang();
    return EMAIL_LOG_STATUS_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`emailLog.status.${value}` as never),
    }));
  });

  readonly eventTypeOptions = computed(() => {
    this.i18n.getAppliedLang();
    return EMAIL_LOG_EVENT_TYPE_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(emailLogEventTypeI18nKey(value) as never),
    }));
  });

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const recipients = this.recipients().trim();
    const subject = this.subject().trim();
    const status = this.status();
    const eventType = this.eventType();

    if (recipients) {
      items.push({ label: this.i18n.tUi('emailLog.fields.recipients'), value: recipients });
    }
    if (subject) {
      items.push({ label: this.i18n.tUi('emailLog.fields.subject'), value: subject });
    }
    if (status?.length) {
      const labels = this.statusOptions()
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('emailLog.fields.status'), value: labels });
    }
    if (eventType?.length) {
      const labels = this.eventTypeOptions()
        .filter((opt) => eventType.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('emailLog.fields.eventType'), value: labels });
    }
    const sentAtLabel = this.formatActiveFilterPeriodDateValue(
      this.periodSentAt(),
      this.sentAt(),
      this.i18n,
    );
    if (sentAtLabel) {
      items.push({ label: this.i18n.tUi('emailLog.fields.sentAt'), value: sentAtLabel });
    }

    return items;
  });

  ngOnInit() {
    this.initStatefulList();
  }

  tone(status: string): ReturnType<typeof emailLogStatusTone> {
    return emailLogStatusTone(status);
  }

  isFailed(row: EmailLogModel): boolean {
    return row.status === EmailLogStatusEnum.FAILED;
  }

  eventTypeLabel(eventType: string): string {
    return this.i18n.tUi(emailLogEventTypeI18nKey(eventType) as never);
  }

  viewDetail(row: EmailLogModel): void {
    this.detailRow.set(row);
    this.detailVisible.set(true);
  }

  onDetailVisibleChange(visible: boolean): void {
    this.detailVisible.set(visible);
    if (!visible) {
      this.detailRow.set(null);
    }
  }

  /** Corpo sempre gerado internamente (templates Thymeleaf próprios, nunca conteúdo de terceiros)
   *  - bypassSecurityTrustHtml é seguro aqui porque quem acessa esta tela já tem
   *  EMAIL_LOG_CONSULT e o conteúdo nunca vem de entrada de usuário. */
  sanitizedBody(body: string | null): SafeHtml | null {
    return body ? this.sanitizer.bypassSecurityTrustHtml(body) : null;
  }

  clear() {
    this.clearTableAndReload(this.dt);
  }

  protected formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(this.i18n.getLang(), { dateStyle: 'short' }).format(date);
  }

  protected override tableStateKey(): string {
    return STATE_KEY.NIMBUSFLOW.SETTINGS.EMAIL_LOG.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSFLOW.SETTINGS.EMAIL_LOG.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSFLOW.SETTINGS.EMAIL_LOG.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  protected override resetFilters(): void {
    this.recipients.set('');
    this.subject.set('');
    this.status.set(null);
    this.eventType.set(null);
    this.sentAt.set(null);
    this.periodSentAt.set(null);
  }

  protected override toFiltersState(): EmailLogFiltersState {
    return {
      recipients: this.recipients(),
      subject: this.subject(),
      status: this.status()?.length ? this.status() : null,
      eventType: this.eventType()?.length ? this.eventType() : null,
      sentAt: this.sentAt(),
      periodSentAt: this.periodSentAt(),
    };
  }

  protected override applyFiltersState(state: EmailLogFiltersState): void {
    this.recipients.set(state.recipients ?? '');
    this.subject.set(state.subject ?? '');
    this.status.set(state.status ?? null);
    this.eventType.set(state.eventType ?? null);
    this.sentAt.set(state.sentAt ?? null);
    this.periodSentAt.set(state.periodSentAt ?? null);
  }

  protected override buildAdvancedFilters(): Partial<EmailLogAdvancedFilters> {
    return {
      recipients: this.recipients().trim() || undefined,
      subject: this.subject().trim() || undefined,
      status: this.status()?.length ? this.status() : undefined,
      eventType: this.eventType()?.length ? this.eventType() : undefined,
      sentAt: this.sentAt() ?? undefined,
      periodSentAt: this.periodSentAt() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(filters: any): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const recipients = readSingleFilterValue(filters, 'recipients');
    if (recipients) {
      items.push({ label: this.i18n.tUi('emailLog.fields.recipients'), value: recipients });
    }

    const subject = readSingleFilterValue(filters, 'subject');
    if (subject) {
      items.push({ label: this.i18n.tUi('emailLog.fields.subject'), value: subject });
    }

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions()
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('emailLog.fields.status'),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const eventTypeValues = readArrayFilterValues(filters, 'eventType');
    if (eventTypeValues.length) {
      const labels = this.eventTypeOptions()
        .filter((option) => eventTypeValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('emailLog.fields.eventType'),
        value: (labels.length ? labels : eventTypeValues).join(', '),
      });
    }

    const sentAt = readDateRangeFilterValue(filters, 'sentAt', this.formatDate.bind(this));
    if (sentAt) {
      items.push({ label: this.i18n.tUi('emailLog.fields.sentAt'), value: sentAt });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<EmailLogAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  protected override loadFirstPage(): void {}
}
