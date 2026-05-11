import { useCallback, useState } from "react";
import { useSearchParams } from "react-router";
import { AnnotationFilter } from "../components/DataSourcePanel/DataSourcePanel";
import { TaskFilterState } from "../components/TaskFilterDialog";

const TASK_PARAM = "task";
const ANNOTATED_PARAM = "annotated";
const LABELS_PARAM = "labels";
const PAGE_PARAM = "page";

export type PageAnchor = "first" | "last";

const parseAnnotationFilter = (raw: string | null): AnnotationFilter =>
  raw === "true" || raw === "false" ? raw : "all";

const parseLabelIds = (raw: string | null): number[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => Number.parseInt(s, 10))
    .filter((n) => Number.isFinite(n));
};

const parsePage = (raw: string | null): number => {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
};

const parseTaskId = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
};

/**
 * Single source of truth for the label page's URL state: `task`, `page`,
 * `annotated`, `labels` query params. One `useSearchParams` call means
 * every setter shares the same closure, so the updaters compose
 * predictably across renders.
 *
 * Page changes leave the task param alone (so the canvas stays on the
 * current task during the new page's fetch) but queue an anchor in
 * local state. The caller is expected to consume the anchor once the
 * new page's tasks load and write the first or last task back.
 */
export const useLabelUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingAnchor, setPendingAnchor] = useState<PageAnchor | null>(null);

  const selectedTaskId = parseTaskId(searchParams.get(TASK_PARAM));
  const page = parsePage(searchParams.get(PAGE_PARAM));
  const filter: TaskFilterState = {
    annotationFilter: parseAnnotationFilter(searchParams.get(ANNOTATED_PARAM)),
    labelIds: parseLabelIds(searchParams.get(LABELS_PARAM)),
  };

  const setSelectedTaskId = useCallback(
    (id: number, opts?: { replace?: boolean }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(TASK_PARAM, String(id));
          return next;
        },
        { replace: opts?.replace ?? false },
      );
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (nextPage: number, anchor: PageAnchor = "first") => {
      setPendingAnchor(anchor);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (nextPage <= 1) next.delete(PAGE_PARAM);
        else next.set(PAGE_PARAM, String(nextPage));
        // Clear the task so the consumer (gated by !isFetching) writes
        // the right task for the *new* page once it loads. Without this
        // the old task lingers in the URL — and the canvas keeps
        // showing it — until something else triggers a re-select.
        next.delete(TASK_PARAM);
        return next;
      });
    },
    [setSearchParams],
  );

  const setFilter = useCallback(
    (nextFilter: TaskFilterState) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (nextFilter.annotationFilter === "all") next.delete(ANNOTATED_PARAM);
        else next.set(ANNOTATED_PARAM, nextFilter.annotationFilter);
        if (nextFilter.labelIds.length === 0) next.delete(LABELS_PARAM);
        else next.set(LABELS_PARAM, nextFilter.labelIds.join(","));
        // Filter change resets pagination; the task stays as-is. If it
        // falls out of the new filter, the canvas still renders it via
        // the task-detail fallback — same pattern as save-with-filter.
        next.delete(PAGE_PARAM);
        return next;
      });
    },
    [setSearchParams],
  );

  return {
    selectedTaskId,
    setSelectedTaskId,
    page,
    setPage,
    filter,
    setFilter,
    pendingAnchor,
    setPendingAnchor,
  };
};
