import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";

interface LicenseRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LicenseRequiredDialog = ({ open, onOpenChange }: LicenseRequiredDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Licensing required</DialogTitle>
          <DialogDescription>
            This project does not have a paid license active. Please contact <a href="mailto:filip@robopipe.io" className="text-blue-500 hover:text-blue-700!">filip@robopipe.io</a> for access to full version.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
