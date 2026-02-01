import { Label } from "@repo/schema";
import { Stack } from "@repo/ui";

export interface SourceImagesSettingsProps {
  labels: Label[];
  activeLabels: Label[];
  setActiveLabels: (labels: Label[]) => void;
}

export const SourceImagesSettings = (props: SourceImagesSettingsProps) => {
  return (
    <div>
      <Stack direction="row"></Stack>
    </div>
  );
};
