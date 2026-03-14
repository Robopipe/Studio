import type { useCreateLimitForm } from "./useCreateLimitForm.hook";

export type FormInstance = ReturnType<typeof useCreateLimitForm>["form"];

// TODO: replace with actual labels from API
export const labelOptions = [
  { label: "Salat", value: "1" },
  { label: "Baguette", value: "2" },
] as const;

export type LabelOption = { label: string; value: string };
