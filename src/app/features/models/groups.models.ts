import { UserMinimalModel } from '@models/user-minimal.models';

export interface PermissionOptionModel {
  id: string;
  name: string;
  description: string;
  appKey: string;
}

export interface UserOptionModel {
  id: string;
  name: string;
  userName: string;
}

export interface GroupModel {
  id: string;
  name: string;
  description: string;
  createdAt?: string | null;
  createdBy?: UserMinimalModel | null;
  permissionsCount?: number;
  usersCount?: number;
  permissions?: PermissionOptionModel[];
  users?: UserOptionModel[];
}

export interface GroupCreateInput {
  name: string;
  description: string;
}

export interface GroupUpdateInput {
  name?: string;
  description?: string;
}

export interface GroupPermissionsInput {
  permissionIds: string[];
}

export interface GroupUsersInput {
  userIds: string[];
}

export interface GroupApiModel {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string | null;
  createdBy?: UserMinimalModel | null;
  permissionsCount?: number | null;
  usersCount?: number | null;
  permissions?: PermissionOptionApiModel[] | null;
  users?: UserOptionApiModel[] | null;
}

export type GroupsFiltersState = {
  name: string;
  description: string;
  createdBy: string[] | null;
  createdAtRange: [string, string] | null;
};

export interface PermissionOptionApiModel {
  id: string;
  name: string;
  description?: string | null;
  appKey?: string | null;
}

export interface UserOptionApiModel {
  id: string;
  name: string;
  userName: string;
}

export function mapPermissionOptionApiModel(
  input: PermissionOptionApiModel,
): PermissionOptionModel {
  return {
    id: input.id,
    name: input.name,
    description: input.description ?? '',
    appKey: input.appKey ?? 'nimbusflow',
  };
}

export function mapUserOptionApiModel(input: UserOptionApiModel): UserOptionModel {
  return {
    id: input.id,
    name: input.name,
    userName: input.userName,
  };
}

export function mapGroupApiModel(input: GroupApiModel): GroupModel {
  return {
    id: input.id,
    name: input.name,
    description: input.description ?? '',
    createdAt: input.createdAt ?? null,
    createdBy: input.createdBy ?? null,
    permissionsCount: input.permissionsCount ?? input.permissions?.length ?? 0,
    usersCount: input.usersCount ?? input.users?.length ?? 0,
    permissions: (input.permissions ?? []).map(mapPermissionOptionApiModel),
    users: (input.users ?? []).map(mapUserOptionApiModel),
  };
}

export function mapGroupApiModels(items: GroupApiModel[] | null | undefined): GroupModel[] {
  return (items ?? []).map(mapGroupApiModel);
}
