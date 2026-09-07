export type Primitive = string;

export type DeepLeafPaths<T, P extends string = ''> = T extends Primitive
  ? P
  : T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: DeepLeafPaths<T[K], P extends '' ? K : `${P}.${K}`>;
      }[keyof T & string]
    : never;

export type DeepGet<T, Path extends string> = Path extends `${infer A}.${infer B}`
  ? A extends keyof T
    ? DeepGet<T[A], B>
    : never
  : Path extends keyof T
    ? T[Path]
    : never;

export function getByPath<T extends object, Path extends string>(
  obj: T,
  path: Path,
): DeepGet<T, Path> {
  return path
    .split('.')
    .reduce(
      (acc: unknown, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined),
      obj as unknown,
    ) as DeepGet<T, Path>;
}
