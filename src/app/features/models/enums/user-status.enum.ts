import { CsTagTone } from '@shared/ui';
import { I18nService } from '@core/i18n/i18n.service';

export enum UserStatus {
  NULL = 'NULL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
  DISABLED = 'DISABLED',
  PENDING_PASSWORD = 'PENDING_PASSWORD',
}

export type UserStatusInput = UserStatus | string | number | null | undefined;

export const USER_STATUS_CODE_MAP: Record<number, UserStatus> = {
  0: UserStatus.NULL,
  1: UserStatus.ACTIVE,
  2: UserStatus.INACTIVE,
  3: UserStatus.BLOCKED,
  4: UserStatus.DISABLED,
  5: UserStatus.PENDING_PASSWORD,
};

export function normalizeUserStatus(status: UserStatusInput): UserStatus | null {
  if (status == null) return null;

  if (typeof status === 'number') {
    return USER_STATUS_CODE_MAP[status] ?? null;
  }

  const normalized = String(status).trim().toUpperCase();

  switch (normalized) {
    case UserStatus.NULL:
      return UserStatus.NULL;
    case UserStatus.ACTIVE:
      return UserStatus.ACTIVE;
    case UserStatus.INACTIVE:
      return UserStatus.INACTIVE;
    case UserStatus.BLOCKED:
      return UserStatus.BLOCKED;
    case UserStatus.DISABLED:
      return UserStatus.DISABLED;
    case UserStatus.PENDING_PASSWORD:
      return UserStatus.PENDING_PASSWORD;
    default:
      return null;
  }
}

export function isActive(status: UserStatusInput): boolean {
  return normalizeUserStatus(status) === UserStatus.ACTIVE;
}

export function isInactive(status: UserStatusInput): boolean {
  return normalizeUserStatus(status) === UserStatus.INACTIVE;
}

export function isBlocked(status: UserStatusInput): boolean {
  return normalizeUserStatus(status) === UserStatus.BLOCKED;
}

export function isDisabled(status: UserStatusInput): boolean {
  return normalizeUserStatus(status) === UserStatus.DISABLED;
}

export function isPendingPassword(status: UserStatusInput): boolean {
  return normalizeUserStatus(status) === UserStatus.PENDING_PASSWORD;
}

export function canBeActivated(status: UserStatusInput): boolean {
  const normalized = normalizeUserStatus(status);
  return normalized === UserStatus.INACTIVE || normalized === UserStatus.DISABLED;
}

export function canLogin(status: UserStatusInput): boolean {
  return normalizeUserStatus(status) === UserStatus.ACTIVE;
}

export function userStatusSeverity(status: UserStatusInput): CsTagTone {
  switch (normalizeUserStatus(status)) {
    case UserStatus.ACTIVE:
      return 'success';

    case UserStatus.PENDING_PASSWORD:
      return 'info';

    case UserStatus.BLOCKED:
      return 'warn';

    case UserStatus.INACTIVE:
      return 'bank';

    case UserStatus.DISABLED:
      return 'danger';

    case UserStatus.NULL:
    default:
      return 'contrast';
  }
}

export function userStatusLabel(status: UserStatusInput, i18n: I18nService): string {
  switch (normalizeUserStatus(status)) {
    case UserStatus.ACTIVE:
      return i18n.tUi('users.status.active');

    case UserStatus.INACTIVE:
      return i18n.tUi('users.status.inactive');

    case UserStatus.BLOCKED:
      return i18n.tUi('users.status.blocked');

    case UserStatus.DISABLED:
      return i18n.tUi('users.status.disabled');

    case UserStatus.PENDING_PASSWORD:
      return i18n.tUi('users.status.pending_password');

    case UserStatus.NULL:
      return i18n.tUi('users.status.null', 'N/A');

    default:
      return i18n.tUi('users.status.unknown', 'Desconhecido');
  }
}

export function allUserStatuses(): UserStatus[] {
  return [
    UserStatus.ACTIVE,
    UserStatus.INACTIVE,
    UserStatus.BLOCKED,
    UserStatus.DISABLED,
    UserStatus.PENDING_PASSWORD,
  ];
}
