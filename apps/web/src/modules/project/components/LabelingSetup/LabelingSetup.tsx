import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label as ShadcnLabel } from "@/modules/shadcn/ui/label";
import { Label } from "@repo/schema";
import { useState } from "react";
import { LabelChip } from "../LabelChip";

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

export const LabelingSetup = ({
  labels,
  onAddLabel,
  onRemoveLabel,
}: LabelingSetupProps) => {
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
    <div className="relative flex flex-col gap-8">
      <h5 className="text-xl font-semibold">Labeling Setup</h5>

      <div className="flex flex-row items-start gap-[60px]">
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <ShadcnLabel htmlFor="labelName" className="font-semibold">
              Label Name
            </ShadcnLabel>
            <Input
              id="labelName"
              placeholder="Label name"
              value={currentName}
              onChange={(e) => setCurrentName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <p className="text-xs text-muted-foreground">Enter a label name</p>
          </div>
          <Button onClick={handleAdd} size="sm" className="w-fit">
            Add Labels
          </Button>
        </div>

        <div className="flex w-[300px] flex-col gap-4">
          <span className="text-base font-bold">
            Labels ({labels.length})
          </span>
          <div className="flex flex-col gap-2">
            {labels.map((label) => (
              <LabelChip
                key={label.name}
                label={label as Label}
                onRemove={() => onRemoveLabel(label.name)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
