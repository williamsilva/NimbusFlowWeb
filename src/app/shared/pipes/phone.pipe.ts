import { Pipe, PipeTransform } from '@angular/core';

import { formatPhone } from '../utils/br-format';

@Pipe({ name: 'phone', standalone: true })
export class PhonePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatPhone(value);
  }
}
