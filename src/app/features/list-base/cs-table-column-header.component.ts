import { CommonModule } from '@angular/common';
import { Component, ContentChild, Input } from '@angular/core';

import { TableModule } from 'primeng/table';

import { CsColumnFilterTemplateDirective } from './cs-column-filter-template.directive';

@Component({
  standalone: true,
  selector: 'th[cs-table-column-header]',
  imports: [CommonModule, TableModule],
  template: `
    <div class="th-flex text-center" [class.justify-content-center]="center">
      <span class="th-label">{{ label }}</span>
    
      @if (sortField || filterField) {
        <span class="th-icons">
          @if (sortField) {
            <p-sortIcon [field]="sortField"></p-sortIcon>
          }
          @if (filterField) {
            <p-columnFilter
              #columnFilter
              [field]="filterField"
              [matchMode]="matchMode"
              [display]="filterDisplay"
              styleClass="cs-colfilter"
              [useGrouping]="useGrouping"
              [showOperator]="showOperator"
              [showAddButton]="showAddButton"
              [showMatchModes]="showMatchModes"
              [showClearButton]="showClearButton"
              [showApplyButton]="showApplyButton"
              >
              <ng-template pTemplate="filter" let-value let-filter="filterCallback">
                <ng-container
              *ngTemplateOutlet="
                filterTemplate?.templateRef ?? null;
                context: {
                  $implicit: value,
                  value: value,
                  filter: filter,
                  columnFilter: columnFilter,
                }
              "
              ></ng-container>
            </ng-template>
          </p-columnFilter>
        }
      </span>
    }
    </div>
    `,
})
export class CsTableColumnHeaderComponent {
  @Input() label = '';

  @Input() sortField: string | null = null;
  @Input() filterField: string | null = null;

  @Input() center = false;

  @Input() filterDisplay: 'menu' | 'row' = 'menu';
  @Input() matchMode = 'in';
  @Input() styleClass = 'cs-colfilter';

  @Input() useGrouping = true;
  @Input() showOperator = false;
  @Input() showAddButton = false;
  @Input() showMatchModes = false;
  @Input() showClearButton = false;
  @Input() showApplyButton = false;

  @ContentChild(CsColumnFilterTemplateDirective)
  filterTemplate?: CsColumnFilterTemplateDirective;
}
