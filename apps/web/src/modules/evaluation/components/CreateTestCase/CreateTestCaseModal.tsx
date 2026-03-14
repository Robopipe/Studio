import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { Input } from "@/modules/shadcn/ui/input";
import { Label } from "@/modules/shadcn/ui/label";
import { EvalTestCaseSeverityEnum, EvalTestCaseTypeEnum } from "@repo/schema";
import { ToggleGroupField } from "./ToggleGroupField";
import { useCreateTestCaseForm } from "./useCreateTestCaseForm.hook";

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CreateTestCaseModal = ({
  projectId,
  open,
  onOpenChange,
}: CreateTestCaseModalProps) => {
  const { form, isSubmitting } = useCreateTestCaseForm({
    projectId,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle className="text-xl font-semibold">
          Add Test case
        </DialogTitle>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col gap-6"
        >
          {/* General section */}
          <div className="flex flex-col gap-3">
            <h6 className="text-sm font-bold">General</h6>

            <form.Field name="name">
              {(field) => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tc-name">Name</Label>
                  <Input
                    id="tc-name"
                    placeholder="Test case name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            {/* Type & Severity row */}
            <div className="flex gap-8">
              <form.Field name="type">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <Label>Type</Label>
                    <ToggleGroupField
                      options={[...typeOptions]}
                      value={field.state.value}
                      onChange={field.handleChange}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="severity">
                {(field) => (
                  <div className="flex flex-col gap-1.5">
                    <Label>If not fulfilled</Label>
                    <ToggleGroupField
                      options={[...severityOptions]}
                      value={field.state.value}
                      onChange={field.handleChange}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </div>

          {/* Footer */}
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
      </DialogContent>
    </Dialog>
  );
};
