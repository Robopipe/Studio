import { EvalTestCaseSeverityEnum, EvalTestCaseTypeEnum } from "@repo/schema";
import { useForm } from "@tanstack/react-form";
import { useCreateEvalTestCaseMutation } from "../../api/evaluationApi";
import {
  createTestCaseFormSchema,
  type CreateTestCaseFormSchema,
} from "../../types/createTestCaseForm.schema";

export function useCreateTestCaseForm({
  projectId,
  onSuccess,
}: {
  projectId: number;
  onSuccess: () => void;
}) {
  const [createTestCase, { isLoading }] = useCreateEvalTestCaseMutation();

  const form = useForm({
    defaultValues: {
      name: "",
      type: EvalTestCaseTypeEnum.CHECK,
      severity: EvalTestCaseSeverityEnum.ALERT,
    } satisfies CreateTestCaseFormSchema as CreateTestCaseFormSchema,
    validators: {
      onChange: createTestCaseFormSchema,
      onSubmit: createTestCaseFormSchema,
    },
    onSubmit: async ({ value }) => {
      await createTestCase({ projectId, body: value }).unwrap();
      onSuccess();
    },
  });

  return { form, isSubmitting: isLoading };
}
