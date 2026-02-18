import { useGetModelQuery } from "@/modules/model/services";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { AnnotateIcon, Stack } from "@repo/ui";
import { CSSProperties } from "react";
import { useDetections } from "../../hooks/useDetections";
import styles from "./DetectionsDisplay.module.scss";

export interface DetectionsDisplayProps {
  selectedMxid: string | null;
  selectedSensorName: string | null;
  selectedModelId: string | null;
}

export const DetectionsDisplay = (props: DetectionsDisplayProps) => {
  const { selectedMxid, selectedModelId, selectedSensorName } = props;
  const { detections } = useDetections({
    selectedMxid: selectedMxid || "",
    selectedSensorName: selectedSensorName || "",
    enabled: !!selectedMxid && !!selectedSensorName && !!selectedModelId,
  });
  const [activeProject] = useActiveProject();
  const { data } = useGetModelQuery(
    {
      projectId: activeProject?.id || 0,
      modelId: Number(selectedModelId) || 0,
    },
    { skip: !activeProject?.id || !selectedModelId },
  );

  const groupedByLabel = detections.detections.reduce(
    (acc, detection) => {
      const label = detection.label || 0;
      if (!acc[label]) {
        acc[label] = [];
      }
      acc[label].push(detection);
      return acc;
    },
    {} as Record<number, typeof detections.detections>,
  );

  return (
    <Stack>
      {Object.entries(groupedByLabel).map(([label, dets]) => (
        <Stack key={label} gap={4}>
          <Stack direction="row" gap={4} align="center">
            <AnnotateIcon
              style={
                {
                  "--color-label": data?.labels?.[Number(label)].color,
                } as CSSProperties
              }
              className={styles.labelIcon}
            />
            <strong>
              {data?.labels?.[Number(label)].name || label} [{dets.length}]
            </strong>
          </Stack>
          {dets.map((detection, idx) => (
            <div key={idx}>
              {detection.confidence !== undefined && (
                <span>
                  Confidence: {(detection.confidence * 100).toFixed(1)}%{" "}
                </span>
              )}
            </div>
          ))}
        </Stack>
      ))}
    </Stack>
  );
};
