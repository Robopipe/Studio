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
import { useGetProjectLabelsQuery } from "@/modules/project/services/projectApi";
import { GeneralSection } from "./GeneralSection";
import { LimitsSection } from "./LimitsSection";
import { SetupSection } from "./SetupSection";
import { SeveritySection } from "./SeveritySection";
import { useLimitForm } from "./useLimitForm.hook";

export type UpdateLimitModalProps = {
  projectId: number;
  configId: number;
  testCaseId: string;
  limit: EvalLimitDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UpdateLimitModal = ({
  projectId,
  configId,
  testCaseId,
  limit,
  open,
  onOpenChange,
}: UpdateLimitModalProps) => {
  const { form, isSubmitting } = useLimitForm({
    projectId,
    configId,
    testCaseId,
    limitId: limit.id,
    initialValues: limit,
    onSuccess: () => onOpenChange(false),
  });

  const { data: labels = [] } = useGetProjectLabelsQuery({ projectId });
  const labelOptions = labels.map((l) => ({ label: l.name, value: String(l.id) }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Limit</DialogTitle>
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
            <SeveritySection />
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
