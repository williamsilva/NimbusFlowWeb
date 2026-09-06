import { Directive, TemplateRef, inject } from '@angular/core';

export interface CsColumnFilterTemplateContext {
  $implicit: unknown;
  value: unknown;
  filter: (value: unknown) => void;
  columnFilter: unknown;
}

@Directive({
  standalone: true,
  selector: 'ng-template[appColumnFilterContent]',
})
export class CsColumnFilterTemplateDirective {
  readonly templateRef = inject<TemplateRef<CsColumnFilterTemplateContext>>(TemplateRef);


  // context só existe pro type predicate abaixo (API do Angular), não é usado como valor.
  static ngTemplateContextGuard(
    _directive: CsColumnFilterTemplateDirective,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: unknown,
  ): context is CsColumnFilterTemplateContext {
    return true;
  }
}
