import { cn } from "@/lib/utils";
import { Button } from "@/modules/shadcn/ui/button";
import { Checkbox } from "@/modules/shadcn/ui/checkbox";
import { CheckIcon } from "lucide-react";

export interface FacetedFilterOption {
  value: string;
  label: string;
}

export interface FacetedFilterGroup {
  label?: string;
  options: FacetedFilterOption[];
}

interface FacetedFilterListProps {
  groups: FacetedFilterGroup[];
  selected: string[];
  onChange: (values: string[]) => void;
  /**
   * Multi mode (default) renders checkboxes; single mode picks at most one
   * value (check-mark rows). An empty selection means "no filter".
   */
  multiple?: boolean;
  emptyText?: string;
}

/**
 * Filter option list meant to live inside a popover (e.g. a column header's
 * funnel filter) — the host owns the trigger and popover chrome.
 */
export const FacetedFilterList = ({
  groups,
  selected,
  onChange,
  multiple = true,
  emptyText = "No options",
}: FacetedFilterListProps) => {
  const optionCount = groups.reduce(
    (count, group) => count + group.options.length,
    0,
  );

  const handleToggle = (value: string) => {
    if (!multiple) {
      onChange(selected[0] === value ? [] : [value]);
      return;
    }
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  return (
    <>
      <div className="max-h-64 overflow-y-auto">
        {optionCount === 0 && (
          <div className="px-2 py-3 text-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        )}
        {groups.map(
          (group, groupIndex) =>
            group.options.length > 0 && (
              <div key={group.label ?? groupIndex}>
                {group.label && (
                  <div className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                    {group.label}
                  </div>
                )}
                {group.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
                    onClick={() => handleToggle(option.value)}
                  >
                    {multiple ? (
                      <Checkbox
                        checked={selected.includes(option.value)}
                        // The row button handles the click; keep the box inert.
                        className="pointer-events-none"
                        tabIndex={-1}
                      />
                    ) : (
                      <CheckIcon
                        className={cn(
                          "size-4",
                          selected[0] === option.value
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    )}
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>
            ),
        )}
      </div>
      {selected.length > 0 && (
        <div className="border-t pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full font-normal"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        </div>
      )}
    </>
  );
};
