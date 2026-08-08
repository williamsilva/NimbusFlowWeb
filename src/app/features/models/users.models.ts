import { GroupModel } from '@models/groups.models';
import { UserMinimalModel } from '@models/user-minimal.models';
import { normalizeUserStatus, UserStatus, UserStatusInput } from '@models/enums/user-status.enum';

export interface UserModel {
  id: string;
  name: string;
  userName: string;
  document: string;
  hasPassword?: boolean;
  status: UserStatus | null;

  createdAt?: string | null;
  createdBy?: UserMinimalModel | null;
  lastLoginAt?: string | null;
  blockedUntil?: string | null;
  passwordChangedAt?: string | null;
  passwordExpiresAt?: string | null;

  groups?: GroupModel[] | string[];
}

export interface UserCreateInput {
  name: string;
  userName: string;
  document: string;
  groupIds?: string[];
}

export interface UserUpdateInput {
  name?: string;
  userName?: string;
  document?: string;
  status?: UserStatus;
  groupIds?: string[];
}

export interface UserBulkStatusInput {
  ids: string[];
}

export type UsersFiltersState = {
  name: string;
  userName: string;
  document: string;
  status: UserStatus[] | null;
  createdAtRange: [string, string] | null;
  createdBy: string[] | null;
  lastLoginAtRange: [string, string] | null;
  blockedUntilRange: [string, string] | null;
  passwordExpiresAtRange: [string, string] | null;
};

/**
 * Payload bruto vindo da API.
 * Aceita status numérico ou string para tolerar mudanças no backend.
 */
export interface UserApiModel {
  id: string;
  name: string;
  userName: string;
  document: string;
  status: UserStatusInput;

  hasPassword?: boolean;

  createdAt?: string | null;
  createdBy?: UserMinimalModel | null;
  blockedUntil?: string | null;
  lastLoginAt?: string | null;
  passwordChangedAt?: string | null;
  passwordExpiresAt?: string | null;

  groups?: GroupModel[] | string[];
}

export function mapUserApiModel(input: UserApiModel): UserModel {
  return {
    ...input,
    status: normalizeUserStatus(input.status),
  };
}

export function mapUserApiModels(items: UserApiModel[] | null | undefined): UserModel[] {
  return (items ?? []).map(mapUserApiModel);
}
