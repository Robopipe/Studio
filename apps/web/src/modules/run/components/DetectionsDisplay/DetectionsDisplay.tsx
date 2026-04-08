import { AnnotateIcon } from "@/components/icons";
import { useGetModelQuery } from "@/modules/model/services";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { CSSProperties } from "react";
import { useDetections } from "../../hooks/useDetections";

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
    <div className="flex flex-col gap-4">
      {Object.entries(groupedByLabel).map(([label, dets]) => (
        <div key={label} className="flex flex-col gap-1">
          <div className="flex flex-row items-center gap-1">
            <AnnotateIcon
              style={
                {
                  color: data?.labels?.[Number(label)].color,
                } as CSSProperties
              }
            />
            <strong>
              {data?.labels?.[Number(label)].name || label} [{dets.length}]
            </strong>
          </div>
          {dets.map((detection, idx) => (
            <div key={idx}>
              {detection.confidence !== undefined && (
                <span>
                  Confidence: {(detection.confidence * 100).toFixed(1)}%{" "}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
