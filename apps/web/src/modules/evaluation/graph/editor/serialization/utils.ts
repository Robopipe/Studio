function isBlank(value: string | number | null | undefined): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  );
}

export function parseRequiredNumber(
  value: string | number | null | undefined,
  message: string,
): number {
  if (isBlank(value)) {
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
  if (isBlank(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}
