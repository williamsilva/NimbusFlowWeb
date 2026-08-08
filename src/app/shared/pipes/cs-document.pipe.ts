import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'csDocument',
  standalone: true,
})
export class CsDocumentPipe implements PipeTransform {
  transform(value: string | number | null | undefined, validate = false): string {
    if (value == null) return '';

    const digits = String(value).replace(/\D+/g, '');

    if (!digits) return '';

    if (digits.length === 11) {
      const formatted = this.formatCPF(digits);

      if (validate && !this.isValidCPF(digits)) {
        return `${formatted} ⚠`;
      }

      return formatted;
    }

    if (digits.length === 14) {
      const formatted = this.formatCNPJ(digits);

      if (validate && !this.isValidCNPJ(digits)) {
        return `${formatted} ⚠`;
      }

      return formatted;
    }

    if (digits.length === 11) {
      return this.formatPIS(digits);
    }

    if (digits.length === 12) {
      return this.formatCEI(digits);
    }

    return digits;
  }

  // ========================
  // FORMATTERS
  // ========================

  private formatCPF(v: string) {
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private formatCNPJ(v: string) {
    return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  private formatPIS(v: string) {
    return v.replace(/(\d{3})(\d{5})(\d{2})(\d)/, '$1.$2.$3-$4');
  }

  private formatCEI(v: string) {
    return v.replace(/(\d{2})(\d{3})(\d{5})(\d{2})/, '$1.$2.$3/$4');
  }

  // ========================
  // VALIDATORS
  // ========================

  private isValidCPF(cpf: string): boolean {
    if (/^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    let rest;

    for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);

    rest = (sum * 10) % 11;

    if (rest === 10 || rest === 11) rest = 0;

    if (rest !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;

    for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);

    rest = (sum * 10) % 11;

    if (rest === 10 || rest === 11) rest = 0;

    return rest === parseInt(cpf.substring(10, 11));
  }

  private isValidCNPJ(cnpj: string): boolean {
    if (/^(\d)\1+$/.test(cnpj)) return false;

    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);

    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += Number(numbers[length - i]) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);

    if (result !== Number(digits[0])) return false;

    length = length + 1;
    numbers = cnpj.substring(0, length);

    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += Number(numbers[length - i]) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);

    return result === Number(digits[1]);
  }
}
