
import { Component, ContentChild, Directive, Input, TemplateRef, inject } from '@angular/core';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';

@Directive({
  selector: 'ng-template[appTableHeader]',
  standalone: true,
})
export class CsTableHeaderTpl {  tpl = inject<TemplateRef<unknown>>(TemplateRef);

}

@Directive({
  selector: 'ng-template[appTableBody]',
  standalone: true,
})
export class CsTableBodyTpl<T = unknown> {  tpl = inject<TemplateRef<{
    $implicit: T;
}>>(TemplateRef);

}

@Directive({
  selector: 'ng-template[appTableLoading]',
  standalone: true,
})
export class CsTableLoadingTpl {  tpl = inject<TemplateRef<unknown>>(TemplateRef);

}

@Directive({
  selector: 'ng-template[appTableEmpty]',
  standalone: true,
})
export class CsTableEmptyTpl {  tpl = inject<TemplateRef<unknown>>(TemplateRef);

}

@Component({
  selector: 'app-data-table-shell',
  standalone: true,
  imports: [TableModule, CardModule],
  templateUrl: './data-table-shell.component.html',
})
export class DataTableShellComponent<T extends { id?: string | number }> {
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
