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
  sortBy: "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
}

export interface TaskSortDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sort: TaskSortState;
  onApply: (sort: TaskSortState) => void;
}

const SORT_BY_OPTIONS: { value: TaskSortState["sortBy"]; label: string }[] = [
  { value: "createdAt", label: "Created at" },
  { value: "updatedAt", label: "Updated at" },
];

export const TaskSortDialog = ({
  open,
  onOpenChange,
  sort,
  onApply,
}: TaskSortDialogProps) => {
  const [sortBy, setSortBy] = useState<TaskSortState["sortBy"]>(sort.sortBy);
  const [sortOrder, setSortOrder] = useState<TaskSortState["sortOrder"]>(sort.sortOrder);

  useEffect(() => {
    if (!open) return;
    setSortBy(sort.sortBy);
    setSortOrder(sort.sortOrder);
  }, [open, sort]);

  const handleSave = () => {
    onApply({ sortBy, sortOrder });
    onOpenChange(false);
  };

  const handleReset = () => {
    setSortBy(DEFAULT_SORT.sortBy);
    setSortOrder(DEFAULT_SORT.sortOrder);
  };

  const newestLabel = "Newest first";
  const oldestLabel = "Oldest first";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-8 sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Sort</DialogTitle>
        </DialogHeader>

        <SortSection title="Sort by">
          <div className="flex flex-col gap-2">
            {SORT_BY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-3 text-sm text-foreground"
              >
                <input
                  type="radio"
                  name="sortBy"
                  value={opt.value}
                  checked={sortBy === opt.value}
                  onChange={() => setSortBy(opt.value)}
                  className="accent-primary"
                />
                {opt.label}
              </label>
            ))}
          </div>
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
              {newestLabel}
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
              {oldestLabel}
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
