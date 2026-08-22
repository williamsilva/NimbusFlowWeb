import { NgControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, Directive, ElementRef, HostListener, OnInit, inject } from '@angular/core';

/**
 * Máscara simples de telefone (mesmo padrão de CpfCnpjMaskDirective):
 *  - até 10 dígitos: (00) 0000-0000 (fixo)
 *  - 11 dígitos: (00) 00000-0000 (celular)
 *
 * Mesma lógica de blocos progressivos de formatPhone() em shared/utils/br-format.ts (lá usada só
 * pra exibição, ex.: PhonePipe) - aqui aplicada enquanto o usuário digita.
 *
 * Mantém o valor do FormControl como SOMENTE DÍGITOS.
 */
@Directive({
  selector: '[csPhoneMask]',
  standalone: true,
})
export class PhoneMaskDirective implements OnInit {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly ngControl = inject(NgControl, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /** Ver o mesmo comentário em CpfCnpjMaskDirective.ngOnInit - `@HostListener('input')` sozinho
   *  não cobre valor carregado via `form.reset()`/`patchValue()` (modo edição), e o guard de
   *  `NgControl` preserva o comportamento em campos de filtro com `[value]` puro (sem form). */
  ngOnInit(): void {
    if (!this.ngControl?.control) return;

    this.applyMask();

    this.ngControl.control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyMask());
  }

  private applyMask(): void {
    const digits = String(this.ngControl?.control?.value ?? '')
      .replace(/\D+/g, '')
      .slice(0, 11);
    const masked = formatPhone(digits);
    if (this.el.nativeElement.value !== masked) {
      this.el.nativeElement.value = masked;
    }
  }

  @HostListener('input')
  onInput() {
    const input = this.el.nativeElement;

    const raw = String(input.value ?? '');
    const caret = input.selectionStart ?? raw.length;

    // Quantos DÍGITOS estavam antes do cursor no texto "cru"
    const digitsBeforeCaret = raw.slice(0, caret).replace(/\D+/g, '').length;

    // Normaliza para só dígitos (máx 11)
    const digits = raw.replace(/\D+/g, '').slice(0, 11);

    // Atualiza o FormControl com dígitos
    const ctrl = this.ngControl?.control;
    if (ctrl && String(ctrl.value ?? '') !== digits) {
      ctrl.setValue(digits, { emitEvent: false });
      ctrl.markAsDirty();
    }

    // Aplica máscara no input
    const masked = formatPhone(digits);
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
      .slice(0, 11);
    input.value = formatPhone(digits);
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

function formatPhone(digits: string): string {
  if (!digits) return '';

  const ddd = digits.slice(0, 2);
  const isMobile = digits.length > 10;
  const middleLen = isMobile ? 5 : 4;
  const middle = digits.slice(2, 2 + middleLen);
  const last = digits.slice(2 + middleLen, 2 + middleLen + 4);

  let out = ddd;
  if (middle) out = `(${ddd}) ${middle}`;
  if (last) out += '-' + last;
  return out;
}
