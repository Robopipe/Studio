import { ColorPicker } from "@/components/ColorPicker";
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
  onUpdateLabelColor?: (name: string, color: string) => void;
}

export const getRandomHex = () => {
  const hex = Math.floor(Math.random() * 16777215).toString(16);
  return `#${hex.padStart(6, "0")}`;
};

export const LabelingSetup = ({
  labels,
  onAddLabel,
  onRemoveLabel,
  onUpdateLabelColor,
}: LabelingSetupProps) => {
  const [currentName, setCurrentName] = useState("");
  const [pendingColor, setPendingColor] = useState(getRandomHex);

  const handleAdd = () => {
    if (!currentName.trim()) return;
    onAddLabel({
      name: currentName.trim(),
      color: pendingColor,
    });
    setCurrentName("");
    setPendingColor(getRandomHex());
  };

  return (
    <div className="relative flex h-full flex-col gap-8">
      <h5 className="text-xl font-semibold">Labeling Setup</h5>

      <div className="flex min-h-0 flex-1 flex-row items-start gap-15">
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
          <div className="flex flex-col gap-1.5">
            <ShadcnLabel className="font-semibold">Label Color</ShadcnLabel>
            <div className="w-40">
              <ColorPicker value={pendingColor} onChange={setPendingColor} />
            </div>
          </div>
          <Button onClick={handleAdd} size="sm" className="w-fit">
            Add Labels
          </Button>
        </div>

        <div className="flex h-full min-h-0 w-75 flex-col gap-4 self-stretch">
          <span className="text-base font-bold">Labels ({labels.length})</span>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {labels.map((label) => (
              <LabelChip
                key={label.name}
                label={label as Label}
                onRemove={() => onRemoveLabel(label.name)}
                onColorChange={
                  onUpdateLabelColor
                    ? (color) => onUpdateLabelColor(label.name, color)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
