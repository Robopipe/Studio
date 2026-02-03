import { useGetTasksQuery } from "@/modules/capture/services/captureApi";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { RangeSlider, Stack, Text } from "@repo/ui";
import { CSSProperties, useMemo } from "react";
import { SettingsCard } from "../SettingsCard";
import styles from "./DatasetSplitSettings.module.scss";

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
  const { data: tasks } = useGetTasksQuery({ projectId: activeProject?.id! });
  const totalImages = useMemo(
    () => tasks?.filter((t) => t.deletedAt === null).length || 0,
    [tasks],
  );

  return (
    <SettingsCard state="complete" stepNumber={2} title="Dataset split">
      <Stack gap={4} className={styles.splitSettings}>
        <Stack direction="row">
          <Text>
            Training set {train}% ({Math.round((train / 100) * totalImages)})
          </Text>
          <Text>
            Validation set {validation}% (
            {Math.round((validation / 100) * totalImages)})
          </Text>
          <Text>
            Testing set {test}% ({Math.round((test / 100) * totalImages)})
          </Text>
        </Stack>
        <RangeSlider
          value={[train, train + validation]}
          className={styles.slider}
          onValueChange={(val) =>
            Array.isArray(val) &&
            onChange({
              train: val[0],
              validation: val[1] - val[0],
              test: 100 - val[1],
            })
          }
          style={{ "--bg-split": `${train}%` } as CSSProperties}
        />
      </Stack>
    </SettingsCard>
  );
};
