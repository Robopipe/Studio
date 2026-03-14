import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { useGetProjectLabelsQuery } from "@/modules/project/services/projectApi";
import { GeneralSection } from "./GeneralSection";
import { LimitsSection } from "./LimitsSection";
import { SetupSection } from "./SetupSection";
import { useLimitForm } from "./useLimitForm.hook";

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
  const { form, isSubmitting } = useLimitForm({
    projectId,
    testCaseId,
    onSuccess: () => onOpenChange(false),
  });

  const { data: labels = [] } = useGetProjectLabelsQuery({ projectId });
  const labelOptions = labels.map((l) => ({ label: l.name, value: String(l.id) }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-160">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Limit</DialogTitle>
        </DialogHeader>

        <form.AppForm>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex flex-col gap-8"
          >
            <GeneralSection />
            <SetupSection labelOptions={[...labelOptions]} />
            <LimitsSection />

            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
};
