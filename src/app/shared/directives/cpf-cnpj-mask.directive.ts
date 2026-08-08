import { NgControl } from '@angular/forms';
import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Máscara simples CPF/CNPJ:
 *  - até 11 dígitos: 000.000.000-00
 *  - 12-14 dígitos: 00.000.000/0000-00
 *
 * Mantém o valor do FormControl como SOMENTE DÍGITOS.
 */
@Directive({
  selector: '[csCpfCnpjMask]',
  standalone: true,
})
export class CpfCnpjMaskDirective {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly ngControl = inject(NgControl, { optional: true });

  @HostListener('input')
  onInput() {
    const input = this.el.nativeElement;

    const raw = String(input.value ?? '');
    const caret = input.selectionStart ?? raw.length;

    // Quantos DÍGITOS estavam antes do cursor no texto "cru"
    const digitsBeforeCaret = raw.slice(0, caret).replace(/\D+/g, '').length;

    // Normaliza para só dígitos (máx 14)
    const digits = raw.replace(/\D+/g, '').slice(0, 14);

    // Atualiza o FormControl com dígitos
    const ctrl = this.ngControl?.control;
    if (ctrl && String(ctrl.value ?? '') !== digits) {
      ctrl.setValue(digits, { emitEvent: false });
      ctrl.markAsDirty();
    }

    // Aplica máscara no input
    const masked = formatCpfCnpj(digits);
    if (input.value !== masked) {
      input.value = masked;
    }

    // Reposiciona o cursor baseado na quantidade de dígitos
    const nextPos = caretFromDigitIndex(masked, digitsBeforeCaret);
    try {
      input.setSelectionRange(nextPos, nextPos);
    } catch {
      // ignore
    }
  }

  @HostListener('blur')
  onBlur() {
    const input = this.el.nativeElement;
    const digits = String(input.value ?? '')
      .replace(/\D+/g, '')
      .slice(0, 14);
    input.value = formatCpfCnpj(digits);
  }
}

function caretFromDigitIndex(masked: string, digitIndex: number): number {
  if (digitIndex <= 0) return 0;
  let count = 0;

  for (let i = 0; i < masked.length; i++) {
    if (/\d/.test(masked[i])) count++;
    if (count >= digitIndex) return i + 1; // posição logo após o dígito
  }

  return masked.length;
}

function formatCpfCnpj(digits: string): string {
  if (!digits) return '';

  if (digits.length <= 11) {
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 9);
    const p4 = digits.slice(9, 11);
    let out = p1;
    if (p2) out += '.' + p2;
    if (p3) out += '.' + p3;
    if (p4) out += '-' + p4;
    return out;
  }

  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 5);
  const p3 = digits.slice(5, 8);
  const p4 = digits.slice(8, 12);
  const p5 = digits.slice(12, 14);
  let out = p1;
  if (p2) out += '.' + p2;
  if (p3) out += '.' + p3;
  if (p4) out += '/' + p4;
  if (p5) out += '-' + p5;
  return out;
}
