import { UserStatus } from '@models/enums/user-status.enum';
import { PeriodEnum } from '@models/enums/period.enum';

export interface UsersAdvancedFilters {
  name?: string;
  userName?: string;
  document?: string;
  status?: UserStatus[] | null;

  lastLoginAt?: string | string[];
  periodLastLoginAt?: PeriodEnum;

  createdAt?: string | string[];
  periodCreatedAt?: PeriodEnum;

  createdBy?: string[] | null;

  blockedUntil?: string | string[];
  periodBlockedUntil?: PeriodEnum;

  passwordExpiresAt?: string | string[];
  periodPasswordExpiresAt?: PeriodEnum;
}
