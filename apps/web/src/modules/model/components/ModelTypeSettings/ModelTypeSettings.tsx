import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import { ProjectTypeEnum } from "@repo/schema";
import { SettingsCard } from "../SettingsCard";

const TYPE_LABELS: Record<ProjectTypeEnum, string> = {
  [ProjectTypeEnum.CLASSIFICATION]: "Classification",
  [ProjectTypeEnum.DETECTION]: "Detection",
  [ProjectTypeEnum.SEGMENTATION]: "Segmentation",
};

type DetectionAnnotationPreset = "detection" | "segmentation" | "both";

const presetToAnnotations = (
  preset: DetectionAnnotationPreset,
): ProjectTypeEnum[] => {
  if (preset === "detection") return [ProjectTypeEnum.DETECTION];
  if (preset === "segmentation") return [ProjectTypeEnum.SEGMENTATION];
  return [ProjectTypeEnum.DETECTION, ProjectTypeEnum.SEGMENTATION];
};

const annotationsToPreset = (
  annotations: ProjectTypeEnum[],
): DetectionAnnotationPreset => {
  if (
    annotations.includes(ProjectTypeEnum.DETECTION) &&
    annotations.includes(ProjectTypeEnum.SEGMENTATION)
  )
    return "both";
  if (annotations.includes(ProjectTypeEnum.SEGMENTATION)) return "segmentation";
  return "detection";
};

export interface ModelTypeSettingsProps {
  trainingType: ProjectTypeEnum;
  annotationsUsed: ProjectTypeEnum[];
  onTrainingTypeChange: (type: ProjectTypeEnum) => void;
  onAnnotationsUsedChange: (annotations: ProjectTypeEnum[]) => void;
}

export const ModelTypeSettings = ({
  trainingType,
  annotationsUsed,
  onTrainingTypeChange,
  onAnnotationsUsedChange,
}: ModelTypeSettingsProps) => {
  const [project] = useActiveProject();

  const handleTrainingTypeChange = (type: ProjectTypeEnum) => {
    onTrainingTypeChange(type);
    if (type === ProjectTypeEnum.DETECTION) {
      onAnnotationsUsedChange([ProjectTypeEnum.DETECTION]);
    } else {
      onAnnotationsUsedChange([type]);
    }
  };

  return (
    <SettingsCard title="model type" state="complete" stepNumber={1}>
      <div className="flex flex-row items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">Training type</span>
          <Select
            value={trainingType}
            onValueChange={(v) =>
              handleTrainingTypeChange(v as ProjectTypeEnum)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ProjectTypeEnum).map((v) => (
                <SelectItem key={v} value={v}>
                  {TYPE_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {project && trainingType !== project.type && (
            <span className="text-xs">
              Default for this project: {TYPE_LABELS[project.type]}
            </span>
          )}
        </div>

        {trainingType === ProjectTypeEnum.DETECTION ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">Annotations used</span>
            <Select
              value={annotationsToPreset(annotationsUsed)}
              onValueChange={(v) =>
                onAnnotationsUsedChange(
                  presetToAnnotations(v as DetectionAnnotationPreset),
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select annotations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="detection">
                  Detection annotations only
                </SelectItem>
                <SelectItem value="segmentation">
                  Segmentation annotations only
                </SelectItem>
                <SelectItem value="both">
                  Both detection &amp; segmentation
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">Annotations used</span>
            <span className="text-sm">
              {TYPE_LABELS[trainingType]} annotations
            </span>
          </div>
        )}
      </div>
    </SettingsCard>
  );
};
