import { EvalTestCaseSeverityEnum, EvalTestCaseTypeEnum } from "@repo/schema";
import { formOptions, revalidateLogic } from "@tanstack/react-form";
import {
  createTestCaseFormSchema,
  type CreateTestCaseFormSchema,
} from "../../types/createTestCaseForm.schema";

export const testCaseFormOptions = formOptions({
  defaultValues: {
    name: "",
    type: EvalTestCaseTypeEnum.CHECK,
    severity: EvalTestCaseSeverityEnum.ALERT,
  } satisfies CreateTestCaseFormSchema as CreateTestCaseFormSchema,
  validationLogic: revalidateLogic(),
  validators: {
    onDynamic: createTestCaseFormSchema,
  },
});
