import { Button } from "@/modules/shadcn/ui/button";
import { Switch } from "@/modules/shadcn/ui/switch";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useCallback, useState } from "react";
import {
  AppliedAugmentation,
  AugmentationDefinition,
  getDefaultValues,
  IMAGE_AUGMENTATIONS,
} from "../augmentationTypes";

export interface AugmentationDialogProps {
  appliedAugmentations: AppliedAugmentation[];
  editing: AppliedAugmentation | null;
  onClose: () => void;
  onApply: (aug: AppliedAugmentation) => void;
  title?: string;
  categoryTitle?: string;
  definitions?: AugmentationDefinition[];
  showDuplicateToggle?: boolean;
}

export const AugmentationDialog = ({
  appliedAugmentations,
  editing,
  onClose,
  onApply,
  title = "Augmentation",
  categoryTitle = "Image Level Augmentations",
  definitions = IMAGE_AUGMENTATIONS,
  showDuplicateToggle = false,
}: AugmentationDialogProps) => {
  const [selectedDef, setSelectedDef] = useState<AugmentationDefinition | null>(
    editing ? definitions.find((d) => d.id === editing.type) ?? null : null,
  );
  const [paramValues, setParamValues] = useState<
    Record<string, number | boolean | string>
  >(editing?.params ?? {});
  const [duplicateImage, setDuplicateImage] = useState(
    editing?.duplicateImage ?? false,
  );

  const appliedIds = new Set(appliedAugmentations.map((a) => a.type));

  const handleSelectAugmentation = useCallback(
    (def: AugmentationDefinition) => {
      if (appliedIds.has(def.id) && editing?.type !== def.id) return;
      setSelectedDef(def);
      if (editing?.type === def.id) {
        setParamValues(editing.params);
      } else {
        setParamValues(getDefaultValues(def));
      }
    },
    [appliedIds, editing],
  );

  const handleParamChange = (
    key: string,
    value: number | boolean | string,
  ) => {
    setParamValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    if (!selectedDef) return;
    const finalParams = duplicateImage
      ? { ...paramValues, p: 1.0 }
      : paramValues;
    onApply({
      id: editing?.id ?? `${selectedDef.id}_${Date.now()}`,
      type: selectedDef.id,
      params: finalParams,
      duplicateImage: showDuplicateToggle ? duplicateImage : undefined,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[101] flex max-h-[85vh] w-[90vw] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-white shadow-[0_24px_48px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.08] px-6 py-4">
          <span className="text-base font-semibold">{title}</span>
          <button
            type="button"
            className="flex cursor-pointer items-center border-none bg-none p-1 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: augmentation grid */}
          <div className="w-[45%] overflow-y-auto border-r border-black/[0.08] p-6">
            <span className="text-xs uppercase">{categoryTitle}</span>
            <div className="mb-6 mt-4 grid grid-cols-5 gap-2">
              {definitions.map((def) => {
                const isSelected = selectedDef?.id === def.id;
                const isApplied =
                  appliedIds.has(def.id) && editing?.type !== def.id;
                return (
                  <button
                    type="button"
                    key={def.id}
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-transparent bg-white p-2.5 text-white transition-colors hover:border-emerald-400 [&_svg]:size-16 [&_svg]:rounded-md [&_svg]:bg-emerald-700",
                      isSelected && "border-emerald-700 bg-emerald-100",
                      isApplied && "cursor-not-allowed opacity-50"
                    )}
                    onClick={() => handleSelectAugmentation(def)}
                    title={isApplied ? "Already applied" : def.name}
                  >
                    {def.image}
                    <span className="text-sm text-foreground">{def.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: details + params */}
          <div className="w-[55%] overflow-y-auto p-6">
            {selectedDef ? (
              <>
                <div className="mb-2 text-xl font-semibold">
                  {selectedDef.name}
                </div>
                <div className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  {selectedDef.description}
                </div>

                {selectedDef.params.length > 0 && (
                  <div className="flex flex-col gap-4">
                    {selectedDef.params.map((param) => {
                      if (showDuplicateToggle && param.key === "p") {
                        return (
                          <div key="duplicate-and-probability">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between py-1">
                                <span className="text-sm font-medium">
                                  Duplicate image
                                </span>
                                <Switch
                                  checked={duplicateImage}
                                  onCheckedChange={setDuplicateImage}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Creates a transformed copy of the image,
                                keeping the original. Replaces probability.
                              </span>
                            </div>
                            {!duplicateImage && (
                              <div className="mt-4 flex flex-col gap-1">
                                <label className="text-[13px] font-medium text-muted-foreground">
                                  {param.label}
                                  {param.unit ? ` (${param.unit})` : ""}
                                </label>
                                <input
                                  type="number"
                                  className="w-full rounded-md border border-black/20 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                                  value={paramValues[param.key] as number}
                                  min={param.min}
                                  max={param.max}
                                  step={param.step}
                                  onChange={(e) =>
                                    handleParamChange(
                                      param.key,
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                />
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div key={param.key} className="flex flex-col gap-1">
                          {param.type === "boolean" ? (
                            <div className="flex items-center justify-between py-1">
                              <span className="text-sm font-medium">
                                {param.label}
                              </span>
                              <Switch
                                checked={paramValues[param.key] as boolean}
                                onCheckedChange={(checked) =>
                                  handleParamChange(param.key, checked)
                                }
                              />
                            </div>
                          ) : (
                            <>
                              <label className="text-[13px] font-medium text-muted-foreground">
                                {param.label}
                                {param.unit ? ` (${param.unit})` : ""}
                              </label>
                              <input
                                type="number"
                                className="w-full rounded-md border border-black/20 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
                                value={paramValues[param.key] as number}
                                min={param.min}
                                max={param.max}
                                step={param.step}
                                onChange={(e) =>
                                  handleParamChange(
                                    param.key,
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Select an augmentation to configure
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-black/[0.08] px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Go Back
          </Button>
          <Button onClick={handleApply} disabled={!selectedDef}>
            Apply
          </Button>
        </div>
      </div>
    </>
  );
};
