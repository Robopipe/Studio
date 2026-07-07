import { cn } from "@/lib/utils";
import { AnnotationAvailableTypes, AnnotationType } from "@repo/schema";

import { ALL_TYPES } from "./types";

const TYPE_LABELS: Record<AnnotationType, string> = {
  rectangle: "Bounding boxes",
  polygon: "Polygons",
  classification: "Classifications",
};

interface AnnotationTypeSelectorProps {
  availableTypes?: AnnotationAvailableTypes;
  selectedTypes: AnnotationType[];
  onToggle: (type: AnnotationType) => void;
}

export const AnnotationTypeSelector = ({
  availableTypes,
  selectedTypes,
  onToggle,
}: AnnotationTypeSelectorProps) => (
  <div className="flex shrink-0 flex-wrap gap-2">
    {ALL_TYPES.map((type) => {
      const available = availableTypes?.[type] ?? true;
      const selected = selectedTypes.includes(type);
      const isLastSelected = selected && selectedTypes.length === 1;
      return (
        <button
          key={type}
          type="button"
          disabled={!available || isLastSelected}
          onClick={() => onToggle(type)}
          title={!available ? "No annotations of this type in this project" : undefined}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
            selected && available
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-black/10 bg-transparent text-muted-foreground opacity-50",
            (!available || isLastSelected) && "cursor-not-allowed",
          )}
        >
          {TYPE_LABELS[type]}
        </button>
      );
    })}
  </div>
);
