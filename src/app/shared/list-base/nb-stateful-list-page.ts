import { computed, signal } from '@angular/core';

import { ActiveFilterEntry } from '../filters-panel/nb-filters-panel.component';
import { DateRange } from '../utils/date-range';

/**
 * Base reutilizável pras telas de lista (Usuários/Grupos/Fornecedores/Obras/Sugestões) - mesmo
 * papel do StatefulListPage do CardSyncWeb, mas adaptada ao contrato client-side do NimbusFlow
 * (o backend devolve a lista inteira, sem paginação/ordenação/filtro no servidor - decisão de
 * propósito, dataset pequeno). Por isso não tem nada do lazy-load/column-filter/state do PrimeNG
 * table que o CardSyncWeb precisa (ali sim há paginação real no servidor).
 *
 * O que fica: o padrão filter/appliedFilter (edição só é aplicada ao clicar "Buscar", igual ao
 * cs-filters-panel), o resumo de filtros ativos pro nb-filters-panel, e a persistência em
 * localStorage do último filtro aplicado + do tamanho de página escolhido - ambos ausentes no
 * NimbusFlow antes disso (um refresh de página perdia o filtro e voltava pro rows padrão).
 *
 * Contrato que cada tela implementa:
 * - emptyFilter(): estado "zerado" do filtro (usado no clear() e no primeiro load)
 * - filtersKey()/tableRowsKey(): chaves de localStorage por tela (ex.: "nimbusflow.users.filters.v1")
 * - refresh(): dispara a carga da lista (service.list().subscribe(...))
 * - buildActiveFilters(filter): "label: valor" de cada campo preenchido, pro popup do nb-filters-panel
 */
export abstract class NbStatefulListPage<TFilter extends object> {
  protected static readonly DEFAULT_ROWS = 20;

  readonly rowsPerPageOptions = [10, 20, 50];
  rows = NbStatefulListPage.DEFAULT_ROWS;

  readonly filter = signal<TFilter>(this.emptyFilter());
  readonly appliedFilter = signal<TFilter>(this.emptyFilter());

  readonly activeFilters = computed<ActiveFilterEntry[]>(() =>
    this.buildActiveFilters(this.appliedFilter()),
  );

  protected abstract emptyFilter(): TFilter;
  protected abstract filtersKey(): string;
  protected abstract tableRowsKey(): string;
  protected abstract refresh(): void;
  protected abstract buildActiveFilters(filter: TFilter): ActiveFilterEntry[];

  /** Chama no construtor/ngOnInit da tela: restaura filtro e tamanho de página persistidos, depois carrega. */
  protected initStatefulList(): void {
    this.restoreRows();
    this.restorePersistedFilter();
    this.refresh();
  }

  /** Aplica o filtro em edição (filter) como o filtro efetivo (appliedFilter) - equivalente ao search() do CardSyncWeb. */
  search(): void {
    const value = this.filter();
    this.appliedFilter.set(value);
    localStorage.setItem(this.filtersKey(), JSON.stringify(value));
  }

  /** Zera os dois signals e limpa a persistência - equivalente ao clear() do CardSyncWeb. */
  clear(): void {
    const empty = this.emptyFilter();
    this.filter.set(empty);
    this.appliedFilter.set(empty);
    localStorage.removeItem(this.filtersKey());
  }

  updateFilter<K extends keyof TFilter>(key: K, value: TFilter[K]): void {
    this.filter.set({ ...this.filter(), [key]: value });
  }

  /** Liga em (onPage) do p-table pra persistir o tamanho de página escolhido pelo usuário. */
  onRowsChange(rows: number): void {
    this.rows = rows;
    localStorage.setItem(this.tableRowsKey(), String(rows));
  }

  private restoreRows(): void {
    const stored = Number(localStorage.getItem(this.tableRowsKey()));
    if (stored > 0) {
      this.rows = stored;
    }
  }

  private restorePersistedFilter(): void {
    const raw = localStorage.getItem(this.filtersKey());
    if (!raw) return;

    try {
      const state = JSON.parse(raw) as TFilter;
      this.filter.set(state);
      this.appliedFilter.set(state);
    } catch {
      localStorage.removeItem(this.filtersKey());
    }
  }

  /**
   * TFilter guarda datas como string ISO (JSON-safe, sobrevive ao localStorage sem revive
   * especial) - esses dois helpers convertem só na borda do template, onde o p-datepicker
   * (selectionMode="range") precisa de Date[] de verdade.
   */
  protected dateRangeToModel(range: DateRange): Date[] | null {
    return range ? [new Date(range[0]), new Date(range[1])] : null;
  }

  protected dateRangeFromModel(value: Date[] | null | undefined): DateRange {
    return value?.[0] && value?.[1] ? [value[0].toISOString(), value[1].toISOString()] : null;
  }
}
