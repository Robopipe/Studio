import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { ProjectTypeEnum } from "@repo/schema";
import { Select, Stack, Text } from "@repo/ui";
import { SettingsCard } from "../SettingsCard";

const TYPE_LABELS: Record<ProjectTypeEnum, string> = {
  [ProjectTypeEnum.CLASSIFICATION]: "Classification",
  [ProjectTypeEnum.DETECTION]: "Detection",
  [ProjectTypeEnum.SEGMENTATION]: "Segmentation",
};

const TRAINING_TYPE_ITEMS = Object.values(ProjectTypeEnum).map((v) => ({
  value: v,
  label: TYPE_LABELS[v],
}));

type DetectionAnnotationPreset = "detection" | "segmentation" | "both";

const DETECTION_PRESET_ITEMS: { value: DetectionAnnotationPreset; label: string }[] = [
  { value: "detection", label: "Detection annotations only" },
  { value: "segmentation", label: "Segmentation annotations only" },
  { value: "both", label: "Both detection & segmentation" },
];

const presetToAnnotations = (preset: DetectionAnnotationPreset): ProjectTypeEnum[] => {
  if (preset === "detection") return [ProjectTypeEnum.DETECTION];
  if (preset === "segmentation") return [ProjectTypeEnum.SEGMENTATION];
  return [ProjectTypeEnum.DETECTION, ProjectTypeEnum.SEGMENTATION];
};

const annotationsToPreset = (annotations: ProjectTypeEnum[]): DetectionAnnotationPreset => {
  if (annotations.includes(ProjectTypeEnum.DETECTION) && annotations.includes(ProjectTypeEnum.SEGMENTATION)) return "both";
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
    // Reset annotationsUsed to the natural default for the new type
    if (type === ProjectTypeEnum.DETECTION) {
      onAnnotationsUsedChange([ProjectTypeEnum.DETECTION]);
    } else {
      onAnnotationsUsedChange([type]);
    }
  };

  return (
    <SettingsCard title="model type" state="complete" stepNumber={1}>
      <Stack direction="row" align="center" gap={16}>
        <Stack gap={4}>
          <Text variant="text-12" weight="500">
            Training type
          </Text>
          <Select
            value={trainingType}
            onValueChange={(v) => handleTrainingTypeChange(v as ProjectTypeEnum)}
            items={TRAINING_TYPE_ITEMS}
            placeholder="Select type"
          />
          {project && trainingType !== project.type && (
            <Text variant="text-12">
              Default for this project: {TYPE_LABELS[project.type]}
            </Text>
          )}
        </Stack>

        {trainingType === ProjectTypeEnum.DETECTION ? (
          <Stack gap={4}>
            <Text variant="text-12" weight="500">
              Annotations used
            </Text>
            <Select
              value={annotationsToPreset(annotationsUsed)}
              onValueChange={(v) =>
                onAnnotationsUsedChange(presetToAnnotations(v as DetectionAnnotationPreset))
              }
              items={DETECTION_PRESET_ITEMS}
              placeholder="Select annotations"
            />
          </Stack>
        ) : (
          <Stack gap={4}>
            <Text variant="text-12" weight="500">
              Annotations used
            </Text>
            <Text variant="text-14">{TYPE_LABELS[trainingType]} annotations</Text>
          </Stack>
        )}
      </Stack>
    </SettingsCard>
  );
};
