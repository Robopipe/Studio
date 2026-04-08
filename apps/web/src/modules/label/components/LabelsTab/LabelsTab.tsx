import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { Annotation } from "../../types/annotations";

export interface LabelsTabProps {
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string) => void;
  onDeleteAnnotation: (id: string) => void;
}

export const LabelsTab = ({
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
  onDeleteAnnotation,
}: LabelsTabProps) => {
  return (
    <div className="flex flex-col gap-4 py-2">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider">
          Regions
        </p>
        <div className="flex flex-col gap-0.5">
          {annotations.map((annotation, index) => {
            const isSelected = annotation.id === selectedAnnotationId;
            return (
              <div
                key={annotation.id}
                className={cn(
                  "group flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-black/[0.04]",
                  isSelected && "bg-indigo-500/10"
                )}
                onClick={() => onSelectAnnotation(annotation.id)}
              >
                <span className="w-5 text-muted-foreground">{index + 1}</span>
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: annotation.color }}
                />
                <span className="flex-1">{annotation.labelName}</span>
                <button
                  type="button"
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded border-none bg-transparent p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 [&_svg]:size-4",
                    isSelected && "opacity-100"
                  )}
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAnnotation(annotation.id);
                  }}
                >
                  <Trash2 />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
