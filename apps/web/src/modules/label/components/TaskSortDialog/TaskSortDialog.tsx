import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { ReactNode, useEffect, useState } from "react";
import { DEFAULT_SORT } from "../../hooks/useLabelUrlState";

export interface TaskSortState {
  sortBy: "createdAt" | "updatedAt" | "meanConfidence" | "minIou" | "precision" | "recall";
  sortOrder: "asc" | "desc";
}

export interface TaskSortDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sort: TaskSortState;
  onApply: (sort: TaskSortState) => void;
  metricsAvailable?: boolean;
}

const DATE_SORT_OPTIONS: { value: TaskSortState["sortBy"]; label: string }[] = [
  { value: "createdAt", label: "Created at" },
  { value: "updatedAt", label: "Updated at" },
];

const METRIC_SORT_OPTIONS: { value: TaskSortState["sortBy"]; label: string }[] = [
  { value: "meanConfidence", label: "Confidence" },
  { value: "minIou", label: "IoU" },
  { value: "precision", label: "Precision" },
  { value: "recall", label: "Recall" },
];

const METRIC_SORT_KEYS = new Set<TaskSortState["sortBy"]>([
  "meanConfidence",
  "minIou",
  "precision",
  "recall",
]);

export const isMetricSort = (key: TaskSortState["sortBy"]): boolean =>
  METRIC_SORT_KEYS.has(key);

export const TaskSortDialog = ({
  open,
  onOpenChange,
  sort,
  onApply,
  metricsAvailable = false,
}: TaskSortDialogProps) => {
  const [sortBy, setSortBy] = useState<TaskSortState["sortBy"]>(sort.sortBy);
  const [sortOrder, setSortOrder] = useState<TaskSortState["sortOrder"]>(sort.sortOrder);

  useEffect(() => {
    if (!open) return;
    // If the URL has a metric sort but metrics are no longer available (e.g. report
    // was re-run), fall back to the default so no invisible radio is "selected".
    const effectiveSortBy =
      isMetricSort(sort.sortBy) && !metricsAvailable ? DEFAULT_SORT.sortBy : sort.sortBy;
    setSortBy(effectiveSortBy);
    setSortOrder(sort.sortOrder);
  }, [open, sort, metricsAvailable]);

  const handleSortByChange = (value: TaskSortState["sortBy"]) => {
    setSortBy(value);
    // Default to worst-first (asc) for metrics, newest-first (desc) for dates.
    setSortOrder(isMetricSort(value) ? "asc" : "desc");
  };

  const handleSave = () => {
    onApply({ sortBy, sortOrder });
    onOpenChange(false);
  };

  const handleReset = () => {
    setSortBy(DEFAULT_SORT.sortBy);
    setSortOrder(DEFAULT_SORT.sortOrder);
  };

  const isMetric = isMetricSort(sortBy);
  const descLabel = isMetric ? "Highest first" : "Newest first";
  const ascLabel = isMetric ? "Lowest first" : "Oldest first";

  const renderRadioOption = (opt: { value: TaskSortState["sortBy"]; label: string }) => (
    <label
      key={opt.value}
      className="flex cursor-pointer items-center gap-3 text-sm text-foreground"
    >
      <input
        type="radio"
        name="sortBy"
        value={opt.value}
        checked={sortBy === opt.value}
        onChange={() => handleSortByChange(opt.value)}
        className="accent-primary"
      />
      {opt.label}
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-8 sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Sort</DialogTitle>
        </DialogHeader>

        <SortSection title="Sort by">
          <div className="flex flex-col gap-2">
            {DATE_SORT_OPTIONS.map(renderRadioOption)}
          </div>
          {metricsAvailable && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Confidence report
              </p>
              {METRIC_SORT_OPTIONS.map(renderRadioOption)}
            </div>
          )}
        </SortSection>

        <SortSection title="Direction">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSortOrder("desc")}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                sortOrder === "desc"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-transparent text-muted-foreground hover:bg-black/[0.06] hover:text-foreground"
              }`}
            >
              {descLabel}
            </button>
            <button
              type="button"
              onClick={() => setSortOrder("asc")}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                sortOrder === "asc"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-transparent text-muted-foreground hover:bg-black/[0.06] hover:text-foreground"
              }`}
            >
              {ascLabel}
            </button>
          </div>
        </SortSection>

        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SortSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-4">
    <h3 className="text-sm font-bold leading-5 text-foreground">{title}</h3>
    {children}
  </section>
);
