import { useEffect, useState } from "react";
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
import { ColorPicker } from "@/components/ColorPicker";

interface EditEvaluationItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; color: string }) => void;
  onDelete?: () => void;
  canDelete?: boolean;
  initialName: string;
  initialColor: string;
}

export function EditEvaluationItemModal({
  open,
  onOpenChange,
  onSave,
  onDelete,
  canDelete = false,
  initialName,
  initialColor,
}: EditEvaluationItemModalProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setColor(initialColor);
    }
  }, [open, initialName, initialColor]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Evaluation Item
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
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {canDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
