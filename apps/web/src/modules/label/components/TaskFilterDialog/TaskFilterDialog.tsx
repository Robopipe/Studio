import { Button } from "@/modules/shadcn/ui/button";
import { Checkbox } from "@/modules/shadcn/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { Label } from "@repo/schema";
import { ReactNode, useEffect, useState } from "react";
import { AnnotationFilter } from "../DataSourcePanel/DataSourcePanel";

export interface TaskFilterState {
  annotationFilter: AnnotationFilter;
  labelIds: number[];
}

export interface TaskFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: TaskFilterState;
  labels: Label[];
  onApply: (filter: TaskFilterState) => void;
}

const filterToCheckboxes = (filter: AnnotationFilter) => ({
  yes: filter === "all" || filter === "true",
  no: filter === "all" || filter === "false",
});

const checkboxesToFilter = (yes: boolean, no: boolean): AnnotationFilter => {
  if (yes && no) return "all";
  if (yes) return "true";
  if (no) return "false";
  // Both unchecked → reset to "all" so the list is never empty by accident.
  return "all";
};

export const TaskFilterDialog = ({
  open,
  onOpenChange,
  filter,
  labels,
  onApply,
}: TaskFilterDialogProps) => {
  const initial = filterToCheckboxes(filter.annotationFilter);
  const [annotatedYes, setAnnotatedYes] = useState(initial.yes);
  const [annotatedNo, setAnnotatedNo] = useState(initial.no);
  const [selectedLabelIds, setSelectedLabelIds] = useState<Set<number>>(
    () => new Set(filter.labelIds),
  );

  // Reset local state to the parent's filter every time the dialog opens so
  // Cancel discards in-flight changes.
  useEffect(() => {
    if (!open) return;
    const next = filterToCheckboxes(filter.annotationFilter);
    setAnnotatedYes(next.yes);
    setAnnotatedNo(next.no);
    setSelectedLabelIds(new Set(filter.labelIds));
  }, [open, filter]);

  const toggleLabel = (id: number) => {
    setSelectedLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    onApply({
      annotationFilter: checkboxesToFilter(annotatedYes, annotatedNo),
      labelIds: [...selectedLabelIds],
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setAnnotatedYes(true);
    setAnnotatedNo(true);
    setSelectedLabelIds(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-8 sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Filter</DialogTitle>
        </DialogHeader>

        <FilterSection title="Annotated">
          <FilterCheckbox
            label="Yes"
            checked={annotatedYes}
            onCheckedChange={setAnnotatedYes}
          />
          <FilterCheckbox
            label="No"
            checked={annotatedNo}
            onCheckedChange={setAnnotatedNo}
          />
        </FilterSection>

        {labels.length > 0 && (
          <FilterSection title="Label">
            {labels.map((label) => (
              <FilterCheckbox
                key={label.id}
                label={label.name}
                checked={selectedLabelIds.has(label.id)}
                onCheckedChange={() => toggleLabel(label.id)}
              />
            ))}
          </FilterSection>
        )}

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

const FilterSection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="flex flex-col gap-4">
    <h3 className="text-sm font-bold leading-5 text-foreground">{title}</h3>
    <div className="grid grid-cols-1 gap-x-2 gap-y-2 sm:grid-cols-2">
      {children}
    </div>
  </section>
);

interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const FilterCheckbox = ({
  label,
  checked,
  onCheckedChange,
}: FilterCheckboxProps) => (
  <label className="flex h-6 cursor-pointer items-center gap-3 text-sm text-foreground">
    <Checkbox
      checked={checked}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      className="size-5"
    />
    {label}
  </label>
);
