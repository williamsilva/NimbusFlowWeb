import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/** Versão "leve" (sem contadores/permissões) - usada na listagem e no multiselect de grupos do
 *  formulário de usuário. */
export interface GroupOption {
  id: string;
  name: string;
  description: string;
}

export interface PermissionOption {
  id: string;
  name: string;
  description: string;
}

export interface GroupDetail extends GroupOption {
  usersCount: number;
  permissionsCount: number;
  createdAt: string;
  permissions: PermissionOption[];
}

export interface GroupRequest {
  name: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class GroupAdminService {
  private readonly baseUrl = `${environment.apiUrl}/bff/v1/groups`;
  private readonly permissionsUrl = `${environment.apiUrl}/bff/v1/permissions`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<GroupOption[]> {
    return this.http.get<GroupOption[]>(this.baseUrl);
  }

  get(id: string): Observable<GroupDetail> {
    return this.http.get<GroupDetail>(`${this.baseUrl}/${id}`);
  }

  create(request: GroupRequest): Observable<GroupDetail> {
    return this.http.post<GroupDetail>(this.baseUrl, request);
  }

  update(id: string, request: GroupRequest): Observable<GroupDetail> {
    return this.http.put<GroupDetail>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  updatePermissions(id: string, permissionIds: string[]): Observable<GroupDetail> {
    return this.http.put<GroupDetail>(`${this.baseUrl}/${id}/permissions`, { permissionIds });
  }

  listPermissionOptions(): Observable<PermissionOption[]> {
    return this.http.get<PermissionOption[]>(this.permissionsUrl);
  }
}
