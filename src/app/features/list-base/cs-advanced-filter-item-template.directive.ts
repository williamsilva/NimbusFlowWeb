import { Directive, TemplateRef } from '@angular/core';

export interface CsAdvancedFilterItemTemplateContext<T = any> {
  $implicit: T;
  option: T;
}

@Directive({
  standalone: true,
  selector: 'ng-template[csAdvancedFilterItem]',
})
export class CsAdvancedFilterItemTemplateDirective<T = any> {
  constructor(readonly templateRef: TemplateRef<CsAdvancedFilterItemTemplateContext<T>>) {}

  static ngTemplateContextGuard<T>(
    _directive: CsAdvancedFilterItemTemplateDirective<T>,
    context: unknown,
  ): context is CsAdvancedFilterItemTemplateContext<T> {
    return true;
  }
}
