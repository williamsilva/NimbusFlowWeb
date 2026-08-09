/** Remove tudo que não for dígito. Usado antes de mandar taxId/phone pro backend. */
export function onlyDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/**
 * Formata progressivamente como CPF (11 dígitos, 000.000.000-00) ou CNPJ (14 dígitos,
 * 00.000.000/0000-00), aceitando o valor já com ou sem máscara. Usado tanto no (input) do
 * formulário (mascara enquanto digita) quanto na listagem (exibição). Mesma lógica do
 * NimbusFlowWeb original (src/app/shared/utils/br-format.ts), portada aqui pra tela de
 * Fornecedores do NimbusFlowWeb.
 */
export function formatTaxId(value: string | null | undefined): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (!digits) {
    return '';
  }
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Formata progressivamente como telefone fixo ((00) 0000-0000, 10 dígitos) ou celular
 * ((00) 00000-0000, 11 dígitos).
 */
export function formatPhone(value: string | null | undefined): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) {
    return '';
  }
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

/** true se, após remover não-dígitos, o valor tiver exatamente 11 (CPF) ou 14 (CNPJ) dígitos. */
export function isValidTaxIdLength(value: string | null | undefined): boolean {
  const len = onlyDigits(value).length;
  return len === 11 || len === 14;
}
