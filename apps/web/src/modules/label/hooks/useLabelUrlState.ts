import { useCallback, useRef } from "react";
import { useSearchParams } from "react-router";
import { AnnotationFilter } from "../components/DataSourcePanel/DataSourcePanel";
import { TaskFilterState } from "../components/TaskFilterDialog";
import { TaskSortState } from "../components/TaskSortDialog";

const TASK_PARAM = "task";
const ANNOTATED_PARAM = "annotated";
const LABELS_PARAM = "labels";
const PAGE_PARAM = "page";
const SORT_BY_PARAM = "sortBy";
const SORT_ORDER_PARAM = "sortOrder";
const UPDATED_BY_PARAM = "updatedBy";

export const DEFAULT_SORT: TaskSortState = { sortBy: "createdAt", sortOrder: "desc" };

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

const parseUpdatedBy = (raw: string | null): number[] => {
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

const parseSortBy = (raw: string | null): "createdAt" | "updatedAt" =>
  raw === "updatedAt" ? "updatedAt" : "createdAt";

const parseSortOrder = (raw: string | null): "asc" | "desc" =>
  raw === "asc" ? "asc" : "desc";

/**
 * Single source of truth for the label page's URL state: `task`, `page`,
 * `annotated`, `labels`, `updatedBy`, `sortBy`, `sortOrder` query params.
 * One `useSearchParams` call means every setter shares the same closure,
 * so the updaters compose predictably across renders.
 */
export const useLabelUrlState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pendingAnchorRef = useRef<PageAnchor | null>(null);

  const selectedTaskId = parseTaskId(searchParams.get(TASK_PARAM));
  const page = parsePage(searchParams.get(PAGE_PARAM));
  const filter: TaskFilterState = {
    annotationFilter: parseAnnotationFilter(searchParams.get(ANNOTATED_PARAM)),
    labelIds: parseLabelIds(searchParams.get(LABELS_PARAM)),
    updatedBy: parseUpdatedBy(searchParams.get(UPDATED_BY_PARAM)),
  };
  const sort: TaskSortState = {
    sortBy: parseSortBy(searchParams.get(SORT_BY_PARAM)),
    sortOrder: parseSortOrder(searchParams.get(SORT_ORDER_PARAM)),
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
      pendingAnchorRef.current = anchor;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (nextPage <= 1) next.delete(PAGE_PARAM);
        else next.set(PAGE_PARAM, String(nextPage));
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
        if (nextFilter.updatedBy.length === 0) next.delete(UPDATED_BY_PARAM);
        else next.set(UPDATED_BY_PARAM, nextFilter.updatedBy.join(","));
        next.delete(PAGE_PARAM);
        return next;
      });
    },
    [setSearchParams],
  );

  const setSort = useCallback(
    (nextSort: TaskSortState) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (nextSort.sortBy === DEFAULT_SORT.sortBy) next.delete(SORT_BY_PARAM);
        else next.set(SORT_BY_PARAM, nextSort.sortBy);
        if (nextSort.sortOrder === DEFAULT_SORT.sortOrder) next.delete(SORT_ORDER_PARAM);
        else next.set(SORT_ORDER_PARAM, nextSort.sortOrder);
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
    sort,
    setSort,
    pendingAnchorRef,
  };
};
