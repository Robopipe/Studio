import { useGetTasksQuery } from "@/modules/capture/services/captureApi";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { SettingsCard } from "../SettingsCard";

export interface DatasetSplit {
  train: number;
  validation: number;
  test: number;
}
export interface DatasetSplitSettingsProps {
  split: DatasetSplit;
  onChange: (newSplit: DatasetSplit) => void;
}

export const DatasetSplitSettings = ({
  split,
  onChange,
}: DatasetSplitSettingsProps) => {
  const { train, validation, test } = split;
  const [activeProject] = useActiveProject();
  const { data: tasks } = useGetTasksQuery({
    projectId: activeProject?.id!,
    annotated: "true",
  });
  const totalImages = tasks?.total ?? 0;

  return (
    <SettingsCard state="complete" stepNumber={3} title="Train/Test split">
      <div className="flex w-full flex-col gap-2">
        <div className="flex flex-row gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            Training set {train}% ({Math.round((train / 100) * totalImages)})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-blue-500" />
            Validation set {validation}% (
            {Math.round((validation / 100) * totalImages)})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-pear-500" />
            Testing set {test}% ({Math.round((test / 100) * totalImages)})
          </span>
        </div>
        <SliderPrimitive.Root
          value={[train, train + validation]}
          min={0}
          max={100}
          thumbAlignment="edge"
          className="w-full"
          onValueChange={(val) =>
            Array.isArray(val) &&
            onChange({
              train: val[0],
              validation: val[1] - val[0],
              test: 100 - val[1],
            })
          }
        >
          <SliderPrimitive.Control className="relative flex h-4 w-full touch-none select-none items-center">
            <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full">
              <div
                className="absolute inset-y-0 left-0 bg-emerald-500"
                style={{ width: `${train}%` }}
              />
              <div
                className="absolute inset-y-0 bg-blue-500"
                style={{
                  left: `${train}%`,
                  width: `${validation}%`,
                }}
              />
              <div
                className="absolute inset-y-0 bg-pear-500"
                style={{
                  left: `${train + validation}%`,
                  right: 0,
                }}
              />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 transition-[color,box-shadow] select-none hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden" />
            <SliderPrimitive.Thumb className="block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 transition-[color,box-shadow] select-none hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden" />
          </SliderPrimitive.Control>
        </SliderPrimitive.Root>
      </div>
    </SettingsCard>
  );
};
