import { X } from "lucide-react";
import {
  AppliedAugmentation,
  AugmentationDefinition,
  getAugmentationSummary,
} from "../augmentationTypes";

export interface AugmentationChipProps {
  augmentation: AppliedAugmentation;
  definition: AugmentationDefinition;
  onEdit: () => void;
  onRemove: () => void;
}

export const AugmentationChip = ({
  augmentation,
  definition,
  onEdit,
  onRemove,
}: AugmentationChipProps) => {
  const summary = getAugmentationSummary(definition, augmentation.params);

  return (
    <div className="flex min-w-55 max-w-[320px] items-center gap-3 rounded-lg border border-black/10 bg-white px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 font-semibold">
          {definition.name}
          {augmentation.duplicateImage && (
            <span className="rounded bg-emerald-50 px-1.5 py-px text-[10px] font-semibold text-emerald-700">
              Duplicate
            </span>
          )}
        </div>
        {summary && (
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground">
            {summary}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="cursor-pointer border-none bg-none p-0 text-sm font-semibold text-emerald-700 hover:underline"
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          type="button"
          className="flex cursor-pointer items-center border-none bg-none p-0 text-muted-foreground hover:text-foreground [&_svg]:size-4"
          onClick={onRemove}
        >
          <X />
        </button>
      </div>
    </div>
  );
};
