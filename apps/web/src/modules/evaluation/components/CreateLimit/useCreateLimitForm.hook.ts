import {
  EvalLimitItemOperatorEnum,
  EvalLimitItemParameterEnum,
} from "@repo/schema";
import { useForm } from "@tanstack/react-form";
import { useCreateEvalLimitMutation } from "../../api/evaluationApi";
import {
  createLimitFormSchema,
  type CreateLimitFormSchema,
  type LimitItemFormSchema,
} from "../../types/createLimitForm.schema";

export const emptyLimitItem: LimitItemFormSchema = {
  id: null,
  limitFrom: null,
  limitTo: null,
  parameter: EvalLimitItemParameterEnum.AREA,
  operator: EvalLimitItemOperatorEnum.AND,
};

export function useCreateLimitForm({
  projectId,
  testCaseId,
  onSuccess,
}: {
  projectId: number;
  testCaseId: string;
  onSuccess: () => void;
}) {
  const [createLimit, { isLoading }] = useCreateEvalLimitMutation();

  const form = useForm({
    defaultValues: {
      name: "",
      targetLabelId: 0,
      targetParentLabelId: null,
      limitItems: [{ ...emptyLimitItem }],
    } satisfies CreateLimitFormSchema as CreateLimitFormSchema,
    validators: {
      onChange: createLimitFormSchema,
      onSubmit: createLimitFormSchema,
    },
    onSubmit: async ({ value }) => {
      await createLimit({ projectId, testCaseId, body: value }).unwrap();
      onSuccess();
    },
  });

  return { form, isSubmitting: isLoading };
}
