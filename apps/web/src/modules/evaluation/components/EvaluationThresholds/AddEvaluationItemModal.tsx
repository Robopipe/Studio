import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { NumberInput } from "@/modules/shadcn/ui/number-input";
import { useState } from "react";
import { ColorPicker } from "./ColorPicker";

const DEFAULT_COLOR = "#22c55e";

interface AddEvaluationItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; color: string; value: number }) => void;
}

export function AddEvaluationItemModal({
  open,
  onOpenChange,
  onSave,
}: AddEvaluationItemModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [value, setValue] = useState<number | null>(null);

  const handleSave = () => {
    if (!name.trim() || value === null) return;
    onSave({ name: name.trim(), color, value: value / 100 });
    resetForm();
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setColor(DEFAULT_COLOR);
    setValue(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Add Evaluation Item
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold text-foreground">General</p>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-normal text-muted-foreground">
              Name
            </Label>
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-normal text-muted-foreground">
              Color
            </Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs font-normal text-muted-foreground">
              Value (%)
            </Label>
            <NumberInput
              decimal
              placeholder="e.g. 90"
              min={0}
              max={100}
              value={value}
              onValueChange={setValue}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!name.trim() || value === null}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
