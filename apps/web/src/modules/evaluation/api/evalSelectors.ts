import { EvalLimit, EvalLimitDetail } from "@repo/schema";
import { evaluationApi } from "./evaluationApi";

type TestCaseArgs = {
  projectId: number;
  configId: number;
  testCaseId: string;
};

// Peek the full-test-case SSOT entry WITHOUT subscribing — `useQueryState` reads the
// cache reactively but never triggers a fetch or keeps the entry alive. This lets the
// table reuse data the graph loaded without itself fanning out N requests on overview
// render (see the SSOT plan). When the entry isn't cached, callers fall back.

/**
 * Limit rows for the table. Returns the SSOT limits (with items, a superset of the
 * row shape) when the graph has loaded them, else the caller's already-loaded fallback
 * (the overview list's embedded limits).
 */
export function useLimitRows(
  args: TestCaseArgs,
  fallback: EvalLimit[],
): EvalLimit[] {
  const { data } = evaluationApi.endpoints.getEvalTestCaseFull.useQueryState(args);
  return data?.limits ?? fallback;
}

/**
 * A single limit WITH its items, read from the SSOT if present (no request). Returns
 * undefined when the full entry isn't cached or the limit isn't found — the caller then
 * lazily fetches the limit detail.
 */
export function useLimitDetail(
  args: TestCaseArgs,
  limitId: string | null,
): EvalLimitDetail | undefined {
  const { data } = evaluationApi.endpoints.getEvalTestCaseFull.useQueryState(args);
  if (!limitId) return undefined;
  return data?.limits.find((limit) => limit.id === limitId);
}
