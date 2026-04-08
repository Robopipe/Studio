import { useGetTasksQuery } from "@/modules/capture/services/captureApi";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Slider } from "@/modules/shadcn/ui/slider";
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
    <SettingsCard state="complete" stepNumber={2} title="Dataset split">
      <div className="flex w-full flex-col gap-1">
        <div className="flex flex-row gap-4">
          <span>
            Training set {train}% ({Math.round((train / 100) * totalImages)})
          </span>
          <span>
            Validation set {validation}% (
            {Math.round((validation / 100) * totalImages)})
          </span>
          <span>
            Testing set {test}% ({Math.round((test / 100) * totalImages)})
          </span>
        </div>
        <Slider
          value={[train, train + validation]}
          className="w-full"
          onValueChange={(val) =>
            Array.isArray(val) &&
            onChange({
              train: val[0],
              validation: val[1] - val[0],
              test: 100 - val[1],
            })
          }
        />
      </div>
    </SettingsCard>
  );
};
