---
name: cs-filters-panel
description: Canonical pattern for building/reviewing the "filtros avançados" panel (cs-filters-panel + cs-advanced-*-filter) on CardSync_web *-list screens. Reference implementation is TransactionsAcquirersSalesListComponent (transactions-acq-sales-list.component.ts/.html).
---

# cs-filters-panel pattern

Every `*-list` screen in CardSync_web (documents/acq, documents/erp, documents/bank,
conciliation, adjustment) uses the same advanced-filters-panel + persisted-table-state
shell. The **canonical reference implementation** is:

- `src/app/features/documents/acq/transactions-acq-sales-list/transactions-acq-sales-list.component.ts`
- `src/app/features/documents/acq/transactions-acq-sales-list/transactions-acq-sales-list.component.html`

When creating a new `*-list` screen, or fixing/auditing an existing one, copy this
pattern exactly rather than improvising. Divergence from it is what causes the kind of
bugs this skill exists to prevent (missing subtext lines, wrong `optionValue`, broken
default sort, duplicate joins under `DISTINCT`, etc. — all found and fixed by comparing
screens against this reference).

## 1. Page shell

```html
<cs-page-header [subtitle]="'...' | translate" [breadcrumb]="[...]">
  <button pButton (click)="refresh()" icon="pi pi-refresh" class="p-button-text p-button-sm"
    [label]="'common.update' | translate"></button>
</cs-page-header>

<cs-filters-panel
  (clear)="clear()"
  [collapsed]="true"
  (search)="search()"
  [actionsAlign]="'start'"
  [activeCount]="activeFiltersCount()"
  [title]="'common.filter' | translate"
  [activeFilterGroups]="activeFilterGroups()"
>
  <div class="grid formgrid gap-0 align-items-end">
    <!-- 3-4 filter controls per row -->
  </div>
  <!-- repeat <div class="grid formgrid gap-0 align-items-end"> per row of filters -->
</cs-filters-panel>

<div class="surface-card border-round px-3 pt-2 pb-3 mt-2">
  <p-table #dt stripedRows dataKey="id" size="small" [rows]="rows" [lazy]="true" showGridlines
    [value]="items()" [rowHover]="true" [paginator]="true" sortMode="multiple"
    stateStorage="local" class="cs-admin-table" [stateKey]="tableStateKey()"
    [showCurrentPageReport]="true" (onPage)="onPageChange($event)"
    [totalRecords]="totalRecords()" (onLazyLoad)="onLazyLoad($event)"
    [loading]="facade.loading()" [paginatorDropdownAppendTo]="'body'"
    [rowsPerPageOptions]="rowsPerPageOptions"
    [currentPageReportTemplate]="'pagination.report' | translate">
    <!-- pTemplate="colgroup" / "header" / "body" / "emptymessage" -->
  </p-table>
</div>
```

The component class extends `StatefulListPage<FiltersState, AdvancedFilters>`, which
supplies `activeFiltersCount()`, `activeFilterGroups()`, `search()`, `clear()`
plumbing, `onLazyLoad`, `onPageChange`, `initStatefulList()`, `reloadWithCurrentState()`,
`tableStateKey()`/`tableRowsKey()`/`filtersKey()` abstract methods, etc. Don't
reimplement that — subclass it like the reference does.

## 2. Filter row controls

Group ~3-4 controls per `<div class="grid formgrid gap-0 align-items-end">` row.
Standard grid class: `col-12 md:col-3 xl:col-2 p-1` for most controls; use
`xl:col-3` for the entity multiselects (establishments/companies/acquirers) since
their dropdown items are wider (see §3). Currency ranges use
`col-12 md:col-6 xl:col-3 p-2` via `cs-currency-range-filter`.

### Date range
```html
<cs-advanced-period-date-filter
  inputId="saleDate"
  [value]="saleDate()"
  [period]="periodSaleDate()"
  periodInputId="periodSaleDate"
  [disabled]="isSaleDateDisabled()"
  class="col-12 md:col-3 xl:col-2 p-1"
  (valueChange)="saleDate.set($event)"
  [periodOptions]="periodEnumOptions()"
  [view]="setViewFormat(periodSaleDate())"
  [dateFormat]="setDateFormat(periodSaleDate())"
  [selectionMode]="setSelectionMode(periodSaleDate())"
  [dateLabel]="'transactions.fields.saleDate' | translate"
  [periodLabel]="'transactions.fields.periodSaleDate' | translate"
  (periodChange)="onPeriodColumnChange(periodSaleDate, saleDate, $event)"
></cs-advanced-period-date-filter>
```

### Free text
```html
<cs-advanced-text-filter
  inputId="rvNumber"
  [value]="rvNumber()"
  class="col-12 md:col-3 xl:col-2 p-1"
  (valueChange)="rvNumber.set($event)"
  [label]="'transactions.fields.rvNumber' | translate"
></cs-advanced-text-filter>
```

### Simple enum multiselect (no custom item template needed)
```html
<cs-advanced-multiselect-filter
  optionLabel="label"
  optionValue="value"
  inputId="modality"
  [value]="modality()"
  [options]="modalityOptions()"
  class="col-12 md:col-3 xl:col-2 p-1"
  (valueChange)="modality.set($event)"
  [label]="'transactions.fields.modality' | translate"
></cs-advanced-multiselect-filter>
```
`modalityOptions()` etc. are `computed(() => { this.i18n.getAppliedLang(); return
allXEnum().map(v => ({ label: xEnumLabel(v, this.i18n), value: v })); })`.

### Currency range
```html
<cs-currency-range-filter
  inputId="grossValue"
  [value]="grossValueRange()"
  class="col-12 md:col-6 xl:col-3 p-2"
  [endLabel]="'common.filters.final' | translate"
  (valueChange)="onGrossValueRangeChange($event)"
  [startLabel]="'common.filters.initial' | translate"
  [label]="'transactions.fields.grossValue' | translate"
></cs-currency-range-filter>
```

## 3. Entity multiselects: company / acquirer / establishment

These three are the ones that most often drift from the reference. **All three follow
the exact same dropdown-item template shape**: label line, then one
`cs-option-item__subtext` div per extra fact, ending with a `cs-tag` that shows the
entity's status (label baked into the tag value, not next to it).

### Company
```html
<cs-advanced-multiselect-filter
  optionValue="id"
  inputId="companies"
  [value]="companies()"
  optionLabel="fantasyName"
  [options]="companiesOptions()"
  class="col-12 md:col-3 xl:col-3 p-1"
  (valueChange)="companies.set($event)"
  [label]="'transactions.fields.company' | translate"
>
  <ng-template csAdvancedFilterItem let-option>
    <div class="cs-option-item">
      <div class="cs-option-item__label">{{ option.fantasyName }}</div>
      <div class="cs-option-item__subtext">
        {{ 'common.registrationNumber' | translate }}: {{ option.cnpj | csDocument }}
      </div>
      <div class="cs-option-item__subtext">
        <cs-tag
          [tone]="statusEnumSeverity(option.status)"
          [value]="('common.status' | translate) + ': ' + statusEnumLabel(option.status)"
        />
      </div>
    </div>
  </ng-template>
</cs-advanced-multiselect-filter>
```

### Acquirer
Identical to Company, just `inputId="acquirer"`, `[value]="acquirers()"`,
`[options]="acquirersOptions()"`, `(valueChange)="acquirers.set($event)"`.

### Establishment
Same shape, with two extra subtext lines (company, then acquirer) before the status tag:
```html
<cs-advanced-multiselect-filter
  optionValue="id"
  optionLabel="pvNumber"
  inputId="establishments"
  [value]="establishments()"
  [options]="establishmentsOptions()"
  class="col-12 md:col-3 xl:col-3 p-1"
  (valueChange)="establishments.set($event)"
  [label]="'transactions.fields.establishment' | translate"
>
  <ng-template csAdvancedFilterItem let-option>
    <div class="cs-option-item">
      <div class="cs-option-item__label">{{ option.pvNumber }}</div>
      <div class="cs-option-item__subtext">
        {{ 'common.company' | translate }}: {{ option.company.fantasyName }}
      </div>
      <div class="cs-option-item__subtext">
        {{ 'common.registrationNumber' | translate }}: {{ option.company.cnpj | csDocument }}
      </div>
      <div class="cs-option-item__subtext">
        {{ 'common.acquirer' | translate }}: {{ option.acquirer.fantasyName }}
      </div>
      <div class="cs-option-item__subtext">
        <cs-tag
          [tone]="statusEnumSeverity(option.status)"
          [value]="('common.status' | translate) + ': ' + statusEnumLabel(option.status)"
        />
      </div>
    </div>
  </ng-template>
</cs-advanced-multiselect-filter>
```

**Exception — do not "fix" this one:** `CreditOrderListComponent` and
`SaleSummaryComponent`'s establishment filter uses `optionValue="pvNumber"` instead of
`optionValue="id"`. That's intentional: `CreditOrderEntity`/`SalesSummaryEntity` store a
raw `pvNumber` column with no FK to `EstablishmentEntity`, so their backend
`*AdvancedFields` spec filters by `originalPvNumber`/`pvNumber` directly, not by
`establishment.id`. Changing `optionValue` there to `"id"` breaks filtering silently.
Everywhere else, `optionValue="id"` is correct.

### Required companion code in the component class

```ts
import { StatusEnum, statusEnumLabel, statusEnumSeverity } from '@models/enums/status.enum';
// ...
statusEnumLabel(value: StatusEnum | null): string {
  return statusEnumLabel(value, this.i18n);
}

statusEnumSeverity(value: StatusEnum | null): CsTagTone {
  return statusEnumSeverity(value);
}
```
This "method has the same name as the imported function" idiom is used throughout the
codebase for every enum label/severity pair (`modalityLabel`/`modalitySeverity`,
`captureEnumLabel`/`captureEnumSeverity`, etc.) — the method body's unqualified call
resolves to the module-level import, not to itself, so it isn't recursive. Always
inject `CompanyFacade`/`AcquirerFacade`/`EstablishmentFacade` and expose
`companiesOptions = this.companyFacade.options`, etc.; call
`loadCompanyOptionsFilter()` / `loadAcquirerOptionsFilter()` /
`loadEstablishmentOptionsFilter()` in `ngOnInit()` before `initStatefulList()`.

`CsTagComponent`/`CsTagTone` come from `@shared/ui` and must be added to the
`imports:` array of the `@Component` decorator (not just the TS import) since these
are standalone components.

### cs-tag sizing inside dropdown items

`cardsync.scss` has a scoped override so `cs-tag` renders thin inside dropdown items
(PrimeNG's default `p-tag` padding is otherwise oversized next to the small
`cs-option-item__subtext` text):
```scss
.cs-option-item .cs-option-item__subtext .p-tag {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.05rem 0.4rem;
  line-height: 1.2;
}
```
Don't reinvent this per-screen — it's already global.

## 4. Column filters (table header) are a *different*, simpler template

The `p-columnFilter` + `cs-column-filter-shell` dropdowns in the table header use
PrimeNG's native `pTemplate="item"` (not the `csAdvancedFilterItem` directive), and are
intentionally simpler — label + one subtext line, **no status tag**:
```html
<ng-template let-option pTemplate="item">
  <div class="cs-option-item">
    <div class="cs-option-item__label">{{ option.fantasyName }}</div>
    <div class="cs-option-item__subtext">
      {{ 'common.registrationNumber' | translate }}: {{ option.cnpj | csDocument }}
    </div>
  </div>
</ng-template>
```
Don't add the status tag here — this skill's status-tag rule applies only to the
`csAdvancedFilterItem` templates inside `cs-advanced-multiselect-filter` (the panel),
not to column-header multiselects.

## 5. Component TypeScript conventions

- `override rows = Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;`
- One signal per filter field (`readonly x = signal<T | null>(null)`), plus a matching
  `xColumnDraft` signal for the table's own column filter (kept separate from the panel's
  signal — see `syncColumnDraftsFromTableState()`/`readArrayFilterValues` helpers).
- Implement: `emptyFiltersState()`, `tableStateKey()`, `tableRowsKey()`, `filtersKey()`,
  `loadFirstPage()`, `loadPage()`, `resetFilters()`, `advancedActiveFilters` (computed
  chip list for the panel's currently-applied advanced filters),
  `mapTableFiltersToActiveItems()` (chip list for column filters),
  `toFiltersState()`/`applyFiltersState()` (persist/restore signals), `buildAdvancedFilters()`
  (signals → `Partial<AdvancedFilters>` sent to the backend, `undefined` when empty so the
  filter is omitted rather than sent as `null`/`[]`).
- `STATE_KEY.CARDSYNC.<AREA>.<SUBAREA>.{FILTERS,TABLE.{STATE,ROWS}}.V1` keys, one triad
  per screen, defined in `state-key.constants.ts`.

## 6. Backend sort/order gotcha (Establishment/Company/Acquirer *Specs)

If a `*Specs` class fetch-joins an association (`fetchIfNotFetched(root, "company")`)
and the query has `query.distinct(true)`, **never** build an `ORDER BY` expression via a
fresh `join(root, "company")` call — Hibernate's `Root.getJoins()` does not see joins
created via `.fetch(...)`, so this silently creates a *second* LEFT JOIN to the same
table. Postgres then rejects the query: `para SELECT DISTINCT, expressões ORDER BY devem
aparecer na lista de seleção`, because the new join's column isn't in the selected
column list. Instead, reuse the fetch:
```java
Path<?> companyPath = (Path<?>) fetchIfNotFetched(root, "company");
Expression<?> companyName = companyPath.get("fantasyName");
```
This applies to any `*Specs.orderByTableSort()` default-sort branch you write by hand
outside the shared `tableSort(...)`/`sortJoin(...)` helpers.
