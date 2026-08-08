import { Directive, TemplateRef } from '@angular/core';

export interface CsColumnFilterTemplateContext {
  $implicit: unknown;
  value: unknown;
  filter: (value: unknown) => void;
  columnFilter: unknown;
}

@Directive({
  standalone: true,
  selector: 'ng-template[csColumnFilterContent]',
})
export class CsColumnFilterTemplateDirective {
  constructor(readonly templateRef: TemplateRef<CsColumnFilterTemplateContext>) {}

  static ngTemplateContextGuard(
    _directive: CsColumnFilterTemplateDirective,
    context: unknown,
  ): context is CsColumnFilterTemplateContext {
    return true;
  }
}
