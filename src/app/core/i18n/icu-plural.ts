/**
 * Suporte mínimo a plural no formato ICU MessageFormat (ex.: "{count, plural, =0 {Nenhum filtro
 * ativo} one {# filtro ativo} other {# filtros ativos}}") - não é uma implementação completa da
 * spec ICU (sem select/ordinal/argumentos aninhados), só o suficiente pro caso de plural simples.
 *
 * Criado como resolvedor local (não via ngx-translate-messageformat-compiler, que o CardSyncWeb
 * usa) porque isso trocaria o TranslateCompiler GLOBAL do app - a spec ICU usa chave simples
 * ({count}), enquanto todas as outras ~100 chaves deste projeto usam interpolação dupla
 * ({{count}}) do compilador padrão do ngx-translate; trocar quebraria todas elas. Como a sintaxe
 * ICU usa chave simples, o compilador padrão (que só substitui {{...}}) nem toca nela - o valor
 * chega aqui intacto pra ser resolvido manualmente.
 */

const ICU_PLURAL_PATTERN = /^\{\s*(\w+)\s*,\s*plural\s*,\s*(.+)\}$/s;
const CLAUSE_PATTERN = /(=\d+|zero|one|two|few|many|other)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g;

/** @returns null se `template` não for uma expressão ICU plural reconhecida (chamador deve usar o
 *  valor original nesse caso). */
export function resolveIcuPlural(template: string, params: Record<string, unknown> | undefined): string | null {
  const match = template.match(ICU_PLURAL_PATTERN);
  if (!match) {
    return null;
  }

  const [, varName, body] = match;
  const rawCount = params?.[varName];
  const count = Number(rawCount);
  if (rawCount === undefined || Number.isNaN(count)) {
    return null;
  }

  const clauses: Record<string, string> = {};
  for (const clauseMatch of body.matchAll(CLAUSE_PATTERN)) {
    clauses[clauseMatch[1]] = clauseMatch[2];
  }

  const chosen = clauses[`=${count}`] ?? clauses[count === 1 ? 'one' : 'other'] ?? clauses['other'] ?? '';
  return chosen.replace(/#/g, String(count)).trim();
}
