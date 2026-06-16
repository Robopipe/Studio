import { cn } from "@/lib/utils";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useGetProjectLabelsQuery } from "@/modules/project/services/projectApi";
import { Button } from "@/modules/shadcn/ui/button";
import { Switch } from "@/modules/shadcn/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/modules/shadcn/ui/tooltip";
import { Label, ProjectTypeEnum } from "@repo/schema";
import { Info, Pencil } from "lucide-react";
import { CSSProperties, useEffect, useMemo } from "react";
import { SettingsCard } from "../SettingsCard";

export const MAX_VISIBLE_THUMBNAILS = 15;

export interface SourceImagesSettingsProps {
  activeLabels: Label[];
  setActiveLabels: (labels: Label[]) => void;
  selectedTaskIds: number[];
  selectedTaskPreviews: { id: number; thumbnailUrl: string }[];
  onEditSelection: () => void;
  datasetError?: string | null;
  useGroups: boolean;
  setUseGroups: (v: boolean) => void;
  trainingType: ProjectTypeEnum;
}

export const SourceImagesSettings = (props: SourceImagesSettingsProps) => {
  const {
    activeLabels,
    setActiveLabels,
    selectedTaskIds,
    selectedTaskPreviews,
    onEditSelection,
    datasetError,
    useGroups,
    setUseGroups,
    trainingType,
  } = props;
  const groupsError =
    useGroups && trainingType !== ProjectTypeEnum.DETECTION
      ? "Only available for detection models."
      : null;
  const [project] = useActiveProject();
  const { data: labels } = useGetProjectLabelsQuery(
    { projectId: project?.id! },
    { skip: !project },
  );
  const mappedLabels = useMemo(
    () =>
      labels?.map((label) => ({
        ...label,
        isActive: activeLabels.some(
          (activeLabel) => activeLabel.id === label.id,
        ),
      })) || [],
    [labels, activeLabels],
  );

  useEffect(() => {
    if (labels && activeLabels.length === 0) {
      setActiveLabels(labels);
    }
  }, [labels]);

  const hasSelection = selectedTaskIds.length > 0;
  const visiblePreviews = selectedTaskPreviews.slice(0, MAX_VISIBLE_THUMBNAILS);
  const overflow = selectedTaskIds.length - visiblePreviews.length;

  return (
    <SettingsCard
      title="source images"
      state={hasSelection && !datasetError ? "complete" : "pending"}
      stepNumber={2}
    >
      <div className="flex flex-1 flex-col gap-4 py-1">
        {/* Images row */}
        <div className="flex items-start gap-5">
          <span className="text-xs text-foreground/90">Images</span>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-1.5">
              {hasSelection ? (
                <>
                  {visiblePreviews.map((preview) => (
                    <img
                      key={preview.id}
                      src={preview.thumbnailUrl}
                      alt=""
                      className="size-9 shrink-0 rounded-lg object-cover"
                    />
                  ))}
                  {overflow > 0 && (
                    <div className="relative size-9 shrink-0 overflow-hidden rounded-lg">
                      {visiblePreviews.length > 0 && (
                        <img
                          src={
                            visiblePreviews[visiblePreviews.length - 1]
                              ?.thumbnailUrl
                          }
                          alt=""
                          className="size-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/65">
                        <span className="text-xs text-white">+{overflow}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-xs text-foreground/60">All images</span>
              )}
            </div>
            {datasetError && (
              <span className="text-xs text-red-600">{datasetError}</span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onEditSelection}>
            <Pencil className="mr-1.5 size-4" />
            Edit
          </Button>
        </div>

        {/* Use groups row */}
        <div className="flex items-center gap-4 py-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground/90">Use groups</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="size-4 shrink-0 cursor-default text-foreground/40" />
                </TooltipTrigger>
                <TooltipContent>
                  When enabled, regions belonging to the same group will be
                  merged into one single region during training.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch checked={useGroups} onCheckedChange={setUseGroups} />
          {groupsError && (
            <span className="text-xs text-red-600">{groupsError}</span>
          )}
        </div>

        {/* Labels row */}
        <div className="flex flex-row flex-wrap items-center gap-2">
          <span className="mr-3 text-xs text-foreground/90">Labels</span>
          {mappedLabels.map((label) => (
            <button
              type="button"
              key={label.id}
              style={{ "--label-color": label.color } as CSSProperties}
              onClick={() =>
                label.isActive
                  ? setActiveLabels(
                      activeLabels.filter((l) => l.id !== label.id),
                    )
                  : setActiveLabels([...activeLabels, label])
              }
              className={cn(
                "flex cursor-pointer items-center rounded-md border border-transparent p-1 transition-colors",
                label.isActive
                  ? "[background-color:color-mix(in_oklab,var(--label-color),transparent_85%)] [border-color:var(--label-color)]"
                  : "bg-black/10 opacity-60 hover:opacity-80",
              )}
            >
              <span
                className="h-6 w-2 shrink-0 rounded-[4px]"
                style={{ background: "var(--label-color)" }}
              />
              <span
                className={cn(
                  "px-2 text-xs leading-4 text-foreground/90",
                  label.isActive ? "font-bold" : "font-normal",
                )}
              >
                {label.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </SettingsCard>
  );
};
