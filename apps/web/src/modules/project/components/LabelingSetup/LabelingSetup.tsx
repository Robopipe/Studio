import { useState } from "react";
import { Label } from "@repo/schema";
import { Button, Heading, Stack, Text, TextInput } from "@repo/ui";
import { LabelChip } from "../LabelChip";
import styles from "../ProjectDetailsForm/ProjectDetailsForm.module.scss";

export type LocalLabel = Pick<Label, "name" | "color">;

interface LabelingSetupProps {
  labels: LocalLabel[];
  onAddLabel: (label: LocalLabel) => void;
  onRemoveLabel: (name: string) => void;
}

export const getRandomHex = () => {
  const hex = Math.floor(Math.random() * 16777215).toString(16);
  return `#${hex.padStart(6, "0")}`;
};

export const LabelingSetup = ({ labels, onAddLabel, onRemoveLabel }: LabelingSetupProps) => {
  const [currentName, setCurrentName] = useState("");

  const handleAdd = () => {
    if (!currentName.trim()) return;
    onAddLabel({
      name: currentName.trim(),
      color: getRandomHex(),
    });
    setCurrentName("");
  };

  return (
    <div className={styles.formSection}>
      <Heading variant="h5" weight="600">Labeling Setup</Heading>
      
      <Stack direction="row" gap={60} align="start">
        <Stack gap={24} style={{ flex: 1 }}>
          <TextInput
            label="Label Name"
            boldLabel
            placeholder="Label name"
            helperText="Enter a label name"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} size="sm">
            Add Labels
          </Button>
        </Stack>

        <Stack gap={16} style={{ width: "300px" }}>
          <Text variant="text-16" weight="700">
            Labels ({labels.length})
          </Text>
          <Stack gap={8}>
            {labels.map((label) => (
              <LabelChip
                key={label.name}
                label={label as Label} 
                onRemove={() => onRemoveLabel(label.name)}
              />
            ))}
          </Stack>
        </Stack>
      </Stack>
    </div>
  );
};