import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { GroupsApiService } from '@features/service/groups.api.service';
import { GroupsAdvancedFilters } from '@features/filter/groups.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';
import {
  GroupModel,
  GroupCreateInput,
  GroupUpdateInput,
  GroupUsersInput,
  GroupPermissionsInput,
} from '@models/groups.models';
import { SelectOptionGroup } from '@models/select-option.model';

type LastQuery = ListQueryDto<GroupsAdvancedFilters>;

@Injectable({ providedIn: 'root' })
export class GroupsFacade {
  private readonly api = inject(GroupsApiService);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _optionsLoading = signal(false);
  private readonly _data = signal<GroupModel[]>([]);
  private readonly _optionsLoadedOnce = signal(false);
  private readonly _lastQuery = signal<LastQuery | null>(null);
  private readonly _options = signal<SelectOptionGroup<string>[]>([]);

  readonly groups = this._data.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly options = this._options.asReadonly();
  readonly totalRecords = this._total.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly optionsLoading = this._optionsLoading.asReadonly();
  readonly optionsLoadedOnce = this._optionsLoadedOnce.asReadonly();

  loadPage(q: LastQuery): void {
    if (this._loading()) return;

    this._loading.set(true);
    this._lastQuery.set(q);

    this.api
      .searchPaged(q)
      .pipe(
        finalize(() => {
          this._loading.set(false);
          this._loadedOnce.set(true);
        }),
      )
      .subscribe({
        next: (res) => {
          this._data.set(res?._embedded?.content ?? []);
          this._total.set(res?.page?.totalElements ?? 0);
        },
        error: () => {
          this._data.set([]);
          this._total.set(0);
        },
      });
  }

  reloadLast(): void {
    const last = this._lastQuery();
    if (!last) return;

    this.loadPage(last);
  }

  loadGroupOptions(force = false): void {
    if (this._optionsLoading()) return;
    if (!force && this._optionsLoadedOnce()) return;

    this._optionsLoading.set(true);

    this.api
      .getAll()
      .pipe(
        finalize(() => {
          this._optionsLoading.set(false);
          this._optionsLoadedOnce.set(true);
        }),
      )
      .subscribe({
        next: (list) => {
          this._options.set(
            (list ?? []).map((g) => ({
              label: g.name,
              value: g.id,
              description: g.description,
            })),
          );
        },
        error: () => {
          this._options.set([]);
        },
      });
  }

  reloadOptions(): void {
    this._optionsLoadedOnce.set(false);
    this.loadGroupOptions(true);
  }

  getById(id: string): Observable<GroupModel> {
    return this.api.getById(id);
  }

  create(input: GroupCreateInput): Observable<GroupModel> {
    this._loading.set(true);
    return this.api.create(input).pipe(
      tap(() => {
        this.reloadLast();
        this.reloadOptions();
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  update(id: string, input: GroupUpdateInput): Observable<GroupModel> {
    this._loading.set(true);
    return this.api.update(id, input).pipe(
      tap(() => {
        this.reloadLast();
        this.reloadOptions();
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  delete(id: string): Observable<void> {
    this._loading.set(true);
    return this.api.delete(id).pipe(
      tap(() => {
        this.reloadLast();
        this.reloadOptions();
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  updatePermissions(id: string, input: GroupPermissionsInput): Observable<GroupModel> {
    this._loading.set(true);
    return this.api.updatePermissions(id, input).pipe(finalize(() => this._loading.set(false)));
  }

  updateUsers(id: string, input: GroupUsersInput): Observable<GroupModel> {
    this._loading.set(true);
    return this.api.updateUsers(id, input).pipe(finalize(() => this._loading.set(false)));
  }
}
