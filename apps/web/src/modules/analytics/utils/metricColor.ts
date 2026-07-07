/**
 * Returns a Tailwind text-color class for a 0–1 quality metric value.
 *
 * Traffic-light scale:
 *   Red    < 0.4
 *   Amber  0.4 – 0.69
 *   Green  ≥ 0.7
 *   null   → muted (no data)
 */
export function metricColor(value: number | null | undefined): string {
  if (value == null) return "text-muted-foreground";
  if (value < 0.4) return "text-red-500";
  if (value < 0.7) return "text-amber-500";
  return "text-emerald-500";
}
