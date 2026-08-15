import { Injectable, inject, signal } from '@angular/core';

import { finalize } from 'rxjs';

import { EmailLogModel } from '@models/email-log.models';
import { EmailLogApiService } from '@features/service/email-log.api.service';
import { EmailLogAdvancedFilters } from '@features/filter/email-log.filters';
import { ListQueryDto } from '@shared/features/list-query/list-query.types';

type LastQuery = ListQueryDto<EmailLogAdvancedFilters>;

/** Tela "Configurações > Auditoria de E-mail" - só leitura (sem approve/reject/reload após
 *  mutação, ao contrário de AddendumsGlobalFacade e afins). */
@Injectable({ providedIn: 'root' })
export class EmailLogFacade {
  private readonly api = inject(EmailLogApiService);

  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<EmailLogModel[]>([]);

  readonly loading = this._loading.asReadonly();
  readonly items = this._items.asReadonly();
  readonly totalRecords = this._total.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();

  loadPage(q: LastQuery): void {
    if (this._loading()) return;
    this._loading.set(true);

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
          this._items.set(res?._embedded?.content ?? []);
          this._total.set(res?.page?.totalElements ?? 0);
        },
        error: () => {
          this._items.set([]);
          this._total.set(0);
        },
      });
  }
}
