import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { EvalLimitDetail } from "@repo/schema";
import { GeneralSection } from "./GeneralSection";
import { LimitsSection } from "./LimitsSection";
import { SetupSection } from "./SetupSection";
import { labelOptions } from "./types";
import { useLimitForm } from "./useLimitForm.hook";

export type UpdateLimitModalProps = {
  projectId: number;
  limit: EvalLimitDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UpdateLimitModal = ({
  projectId,
  limit,
  open,
  onOpenChange,
}: UpdateLimitModalProps) => {
  const { form, isSubmitting } = useLimitForm({
    projectId,
    limitId: limit.id,
    initialValues: limit,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-160">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Limit</DialogTitle>
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
