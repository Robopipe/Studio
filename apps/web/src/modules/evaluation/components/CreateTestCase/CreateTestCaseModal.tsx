import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { EvalTestCaseSeverityEnum, EvalTestCaseTypeEnum } from "@repo/schema";
import { ToggleGroupField } from "./ToggleGroupField";
import { useTestCaseForm } from "./useTestCaseForm.hook";

const typeOptions = [
  { label: "Check", value: EvalTestCaseTypeEnum.CHECK },
  { label: "Defect", value: EvalTestCaseTypeEnum.DEFECT },
] as const;

const severityOptions = [
  { label: "Alert", value: EvalTestCaseSeverityEnum.ALERT },
  { label: "Warning", value: EvalTestCaseSeverityEnum.WARNING },
] as const;

export type CreateTestCaseModalProps = {
  projectId: number;
  configId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CreateTestCaseModal = ({
  projectId,
  configId,
  open,
  onOpenChange,
}: CreateTestCaseModalProps) => {
  const { form, isSubmitting } = useTestCaseForm({
    projectId,
    configId,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle className="text-xl font-semibold">
          Add Test case
        </DialogTitle>

        <form.AppForm>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-3">
              <h6 className="text-sm font-bold">General</h6>

              <form.AppField name="name">
                {(field) => (
                  <field.TextInput label="Name" placeholder="Test case name" />
                )}
              </form.AppField>

              <div className="flex gap-8">
                <form.AppField name="type">
                  {() => (
                    <ToggleGroupField
                      label="Type"
                      options={[...typeOptions]}
                    />
                  )}
                </form.AppField>

                <form.AppField name="severity">
                  {() => (
                    <ToggleGroupField
                      label="If not fulfilled"
                      options={[...severityOptions]}
                    />
                  )}
                </form.AppField>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <DialogClose
                render={<Button type="button" variant="outline" size="lg" />}
              >
                Cancel
              </DialogClose>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                Save
              </Button>
            </div>
          </form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
};
