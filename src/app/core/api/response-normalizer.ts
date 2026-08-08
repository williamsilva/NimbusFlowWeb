/**
 * Normaliza respostas que vêm com "wrapper" de tipagem (ex.: Jackson Default Typing),
 * no formato: ["java.util.ImmutableCollections$ListN", [ ...itens... ]]
 *
 * Idealmente isso deve ser removido no backend, mas aqui tratamos de forma defensiva
 * para não quebrar o front enquanto o backend é ajustado.
 */
export function unwrapJacksonList<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return (value as T[]) ?? [];

  // Padrão conhecido: ["java.util.ImmutableCollections$ListN", [...]]
  if (
    value.length === 2 &&
    typeof value[0] === 'string' &&
    value[0].startsWith('java.') &&
    Array.isArray(value[1])
  ) {
    return value[1] as T[];
  }

  return value as T[];
}
