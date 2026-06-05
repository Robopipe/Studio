import { z } from "zod";

export const validateCameraApiUrl = (
  value: string | null | undefined,
): string | null => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  const result = z.url().safeParse(trimmed);
  return result.success
    ? null
    : "Please enter a valid URL (e.g. https://robopipe-1.local or http://192.168.1.1:8000)";
};
