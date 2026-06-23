import { Button } from "@/modules/shadcn/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import { EvalLimit, EvalTestCaseDetail, EvalSeverityEnum } from "@repo/schema";
import { useRef } from "react";
import { ToggleGroupField } from "../CreateTestCase/ToggleGroupField";
import { useTestCaseForm } from "../CreateTestCase/useTestCaseForm.hook";
import { LogicBuilder } from "./LogicBuilder/LogicBuilder";
import { LogicBuilderState } from "./LogicBuilder/useLogicBuilder.hook";

const severityOptions = [
  { label: "Alert", value: EvalSeverityEnum.ALERT },
  { label: "Warning", value: EvalSeverityEnum.WARNING },
] as const;

export type UpdateTestCaseModalProps = {
  projectId: number;
  configId: number;
  testCase: EvalTestCaseDetail;
  /** All limits available for this project (used as the draggable palette) */
  availableLimits?: EvalLimit[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UpdateTestCaseModal = ({
  projectId,
  configId,
  testCase,
  availableLimits = [],
  open,
  onOpenChange,
}: UpdateTestCaseModalProps) => {
  const builderStateRef = useRef<LogicBuilderState | null>(null);

  const { form, isSubmitting } = useTestCaseForm({
    projectId,
    configId,
    testCaseId: testCase.id,
    initialValues: testCase,
    getLogicNodes: () => builderStateRef.current?.nodes ?? testCase.logicNodes,
    onSuccess: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-xl font-semibold">Edit Test case</DialogTitle>

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

            <div className="flex flex-col gap-2">
              <h6 className="text-sm font-bold">Logic</h6>
              <LogicBuilder
                testCase={testCase}
                availableLimits={
                  availableLimits.length > 0
                    ? availableLimits
                    : testCase.limits
                }
                builderRef={(state) => {
                  builderStateRef.current = state;
                }}
              />
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
