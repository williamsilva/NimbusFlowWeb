import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusflow.common.notification.mail.EmailLogStatus do NimbusFlowServer. */
export enum EmailLogStatusEnum {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export const EMAIL_LOG_STATUS_VALUES: EmailLogStatusEnum[] = [
  EmailLogStatusEnum.SENT,
  EmailLogStatusEnum.FAILED,
];

const TONE_MAP: Record<EmailLogStatusEnum, StatusTone> = {
  [EmailLogStatusEnum.SENT]: 'success',
  [EmailLogStatusEnum.FAILED]: 'danger',
};

export function emailLogStatusTone(status: EmailLogStatusEnum | string | null | undefined): StatusTone {
  return status ? (TONE_MAP[status as EmailLogStatusEnum] ?? 'neutral') : 'neutral';
}
