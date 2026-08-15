import { PeriodEnum } from '@models/enums/period.enum';
import { EmailLogStatusEnum } from '@models/enums/email-log-status.enum';

/**
 * Espelha com.nimbusflow.common.notification.mail.EmailLogModel do NimbusFlowServer - auditoria de
 * TODO e-mail enviado pelo sistema (destinatários, assunto, corpo renderizado e status). Tela
 * "Configurações > Auditoria de E-mail", só leitura (sem reenvio nem edição).
 */
export interface EmailLogModel {
  id: string;
  eventType: string;
  /** Todos os destinatários, separados por ", " (ver EmailLogEntity.recipients). */
  recipients: string;
  subject: string;
  template: string;
  /** Corpo HTML renderizado no momento do envio - null em registros anteriores a esta feature. */
  body: string | null;
  status: EmailLogStatusEnum;
  errorMessage: string | null;
  requestedById: string | null;
  sentAt: string;
}

export type EmailLogApiModel = EmailLogModel;

/** Estado persistido do painel de filtros avançados da listagem de Auditoria de E-mail. */
export type EmailLogFiltersState = {
  recipients: string;
  subject: string;
  status: string[] | null;
  eventType: string[] | null;
  sentAt: string | string[] | null;
  periodSentAt: PeriodEnum | null;
};

export function mapEmailLogApiModel(input: EmailLogApiModel): EmailLogModel {
  return { ...input };
}

export function mapEmailLogApiModels(items: EmailLogApiModel[] | null | undefined): EmailLogModel[] {
  return (items ?? []).map(mapEmailLogApiModel);
}
