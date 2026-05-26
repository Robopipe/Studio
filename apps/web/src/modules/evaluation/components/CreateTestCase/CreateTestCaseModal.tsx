import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { EvalSeverityEnum } from "@repo/schema";
import { ToggleGroupField } from "./ToggleGroupField";
import { useTestCaseForm } from "./useTestCaseForm.hook";

const severityOptions = [
  { label: "Alert", value: EvalSeverityEnum.ALERT },
  { label: "Warning", value: EvalSeverityEnum.WARNING },
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

              <form.AppField
                name="enabled"
                children={(field) => <field.Switch label="Enabled" />}
              />

              <form.AppField name="name">
                {(field) => (
                  <field.TextInput label="Name" placeholder="Test case name" />
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
