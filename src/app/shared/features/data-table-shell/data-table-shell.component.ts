
import { Component, ContentChild, Directive, Input, TemplateRef } from '@angular/core';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';

@Directive({
  selector: 'ng-template[csTableHeader]',
  standalone: true,
})
export class CsTableHeaderTpl {
  constructor(public tpl: TemplateRef<unknown>) {}
}

@Directive({
  selector: 'ng-template[csTableBody]',
  standalone: true,
})
export class CsTableBodyTpl<T = unknown> {
  constructor(public tpl: TemplateRef<{ $implicit: T }>) {}
}

@Directive({
  selector: 'ng-template[csTableLoading]',
  standalone: true,
})
export class CsTableLoadingTpl {
  constructor(public tpl: TemplateRef<unknown>) {}
}

@Directive({
  selector: 'ng-template[csTableEmpty]',
  standalone: true,
})
export class CsTableEmptyTpl {
  constructor(public tpl: TemplateRef<unknown>) {}
}

@Component({
  selector: 'cs-data-table-shell',
  standalone: true,
  imports: [TableModule, CardModule],
  templateUrl: './data-table-shell.component.html',
})
export class DataTableShellComponent<T extends { id?: any }> {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() value: T[] = [];
  @Input() loading = false;

  @Input() rows = 20;
  @Input() paginator = true;

  @Input() dataKey = 'id';
  @Input() tableClass = 'p-datatable-sm mt-3';

  @Input() sortMode: 'single' | 'multiple' = 'multiple';
  @Input() removableSort = true;
  @Input() filterDisplay: 'row' | 'menu' = 'menu';
  @Input() rowHover = true;

  @Input() responsiveLayout: 'scroll' | 'stack' = 'scroll';

  @ContentChild(CsTableHeaderTpl) headerTpl?: CsTableHeaderTpl;
  @ContentChild(CsTableBodyTpl) bodyTpl?: CsTableBodyTpl<T>;
  @ContentChild(CsTableLoadingTpl) loadingTpl?: CsTableLoadingTpl;
  @ContentChild(CsTableEmptyTpl) emptyTpl?: CsTableEmptyTpl;
}

export const DATA_TABLE_SHELL_IMPORTS = [
  DataTableShellComponent,
  CsTableHeaderTpl,
  CsTableBodyTpl,
  CsTableLoadingTpl,
  CsTableEmptyTpl,
] as const;
