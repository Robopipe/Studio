// FIX(bug): a whitespace-only string passes validation as 0 — Number('  ') === 0 and is finite,
// and only the exact empty string '' is rejected by the guard below — fix: treat strings with
// value.trim() === '' the same as '' (here and in parseNullableNumber, which returns 0 instead
// of null for the same input); why: the "required" check (e.g. 'Limit label is required.') is
// silently satisfied with a bogus 0 for blank input.
export function parseRequiredNumber(
  value: string | number | null | undefined,
  message: string,
): number {
  if (value === null || value === undefined || value === "") {
    throw new Error(message);
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(message);
  }

  return parsed;
}

export function parseNullableNumber(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}
