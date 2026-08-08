export function onlyDigits(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;

  const digits = value.replace(/\D/g, '').trim();
  return digits.length ? digits : undefined;
}

export function formatCpfCnpj(value: string | null | undefined): string {
  const digits = onlyDigits(value) ?? '';

  if (!digits) return '';

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
}
