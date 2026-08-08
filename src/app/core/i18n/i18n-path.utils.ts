export type Primitive = string;

export type DeepLeafPaths<T, P extends string = ''> = T extends Primitive
  ? P
  : T extends Record<string, any>
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

export function getByPath<T extends object>(obj: T, path: string): any {
  return path.split('.').reduce((acc: any, key) => (acc ? acc[key] : undefined), obj);
}
