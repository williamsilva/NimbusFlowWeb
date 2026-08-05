import { Pipe, PipeTransform } from '@angular/core';

import { formatTaxId } from '../utils/br-format';

@Pipe({ name: 'taxId', standalone: true })
export class TaxIdPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatTaxId(value);
  }
}
