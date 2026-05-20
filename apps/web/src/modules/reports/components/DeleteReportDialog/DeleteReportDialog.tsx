import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";

export interface DeleteReportDialogProps {
  reportId: number;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const DeleteReportDialog = ({
  reportId,
  onCancel,
  onConfirm,
  isLoading = false,
}: DeleteReportDialogProps) => {
  return (
    <Dialog open onOpenChange={(open) => !open && !isLoading && onCancel()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            Delete report #{reportId}?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The generated file will be permanently
            removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting…" : "Delete report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
