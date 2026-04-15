
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

const PRESET_LABELS: Record<DetectionAnnotationPreset, string> = {
  detection: "Detection annotations only",
  segmentation: "Segmentation annotations only",
  both: "Both detection & segmentation",
};

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
      <div className="flex w-full flex-1 flex-row items-start gap-9">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xs font-normal text-black/90">Training type</span>
          <Select
            value={trainingType}
            onValueChange={(v) =>
              handleTrainingTypeChange(v as ProjectTypeEnum)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type">
                {(value) =>
                  value ? TYPE_LABELS[value as ProjectTypeEnum] : "Select type"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.values(ProjectTypeEnum).map((v) => (
                <SelectItem key={v} value={v}>
                  {TYPE_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {trainingType === ProjectTypeEnum.DETECTION ? (
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs font-normal text-black/90">Annotations used</span>
            <Select
              value={annotationsToPreset(annotationsUsed)}
              onValueChange={(v) =>
                onAnnotationsUsedChange(
                  presetToAnnotations(v as DetectionAnnotationPreset),
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select annotations">
                  {(value) =>
                    value
                      ? PRESET_LABELS[value as DetectionAnnotationPreset]
                      : "Select annotations"
                  }
                </SelectValue>
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
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs font-normal text-black/90">Annotations used</span>
            <span className="text-sm">
              {TYPE_LABELS[trainingType]} annotations
            </span>
          </div>
        )}
      </div>
    </SettingsCard>
  );
};
