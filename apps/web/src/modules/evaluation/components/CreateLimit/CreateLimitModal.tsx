import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { GeneralSection } from "./GeneralSection";
import { LimitsSection } from "./LimitsSection";
import { SetupSection } from "./SetupSection";
import { labelOptions } from "./types";
import { useCreateLimitForm } from "./useCreateLimitForm.hook";

export type CreateLimitModalProps = {
  projectId: number;
  testCaseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CreateLimitModal = ({
  projectId,
  testCaseId,
  open,
  onOpenChange,
}: CreateLimitModalProps) => {
  const { form, isSubmitting } = useCreateLimitForm({
    projectId,
    testCaseId,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-160">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Limit</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col gap-8"
        >
          <GeneralSection form={form} />
          <SetupSection form={form} labelOptions={[...labelOptions]} />
          <LimitsSection form={form} />

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
