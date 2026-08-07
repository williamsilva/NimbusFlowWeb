export type DateRange = [string, string] | null;

/** Inclui a borda (from/to) - mesmo critério usado pelo StatefulListPage do CardSyncWeb. */
export function isWithinDateRange(value: string | null | undefined, range: DateRange): boolean {
  if (!range) return true;
  if (!value) return false;

  const time = new Date(value).getTime();
  const from = new Date(range[0]).getTime();
  const to = new Date(range[1]).getTime();

  return time >= from && time <= to;
}
