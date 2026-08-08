import { UserStatus } from '@models/enums/user-status.enum';

export interface UsersAdvancedFilters {
  name?: string;
  userName?: string;
  document?: string;
  status?: UserStatus[] | null;

  lastLoginAtTo?: string;
  lastLoginAtFrom?: string;

  createdAtTo?: string;
  createdAtFrom?: string;

  createdBy?: string[] | null;

  blockedUntilTo?: string;
  blockedUntilFrom?: string;

  passwordExpiresAtTo?: string;
  passwordExpiresAtFrom?: string;
}
