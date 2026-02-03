import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useGetProjectLabelsQuery } from "@/modules/project/services/projectApi";
import { Label } from "@repo/schema";
import { Stack, Text } from "@repo/ui";
import { CSSProperties, useEffect, useMemo } from "react";
import { SettingsCard } from "../SettingsCard";
import styles from "./SourceImagesSettings.module.scss";

export interface SourceImagesSettingsProps {
  activeLabels: Label[];
  setActiveLabels: (labels: Label[]) => void;
}

export const SourceImagesSettings = (props: SourceImagesSettingsProps) => {
  const { activeLabels, setActiveLabels } = props;
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

  return (
    <SettingsCard title="source images" state="complete" stepNumber={1}>
      {mappedLabels.map((label) => (
        <Stack
          key={label.id}
          direction="row"
          style={{ "--color-label": label.color } as CSSProperties}
          className={`${styles.label} ${label.isActive ? styles.active : ""}`}
          gap={6}
          align="center"
          onClick={() =>
            label.isActive
              ? setActiveLabels(activeLabels.filter((l) => l.id !== label.id))
              : setActiveLabels([...activeLabels, label])
          }
        >
          <div className={styles.colorIndicator} />
          <Text variant="text-14">{label.name}</Text>
        </Stack>
      ))}
    </SettingsCard>
  );
};
