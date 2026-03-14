import { EvalLimitDetail, EvalLimitItemOperatorEnum, EvalLimitItemParameterEnum } from "@repo/schema";
import { useForm } from "@tanstack/react-form";
import { useCreateEvalLimitMutation, useUpdateEvalLimitMutation } from "../../api/evaluationApi";
import { createLimitFormSchema, type CreateLimitFormSchema, type LimitItemFormSchema } from "../../types/createLimitForm.schema";

export const emptyLimitItem: LimitItemFormSchema = {
  id: null,
  limitFrom: null,
  limitTo: null,
  parameter: EvalLimitItemParameterEnum.AREA,
  operator: EvalLimitItemOperatorEnum.AND,
};

type CreateOptions = {
  projectId: number;
  testCaseId: string;
  onSuccess: () => void;
};

type UpdateOptions = {
  projectId: number;
  testCaseId: string;
  limitId: string;
  initialValues: EvalLimitDetail;
  onSuccess: () => void;
};

export type LimitFormOptions = CreateOptions | UpdateOptions;

function isUpdate(options: LimitFormOptions): options is UpdateOptions {
  return "limitId" in options;
}

function toFormValues(limit: EvalLimitDetail): CreateLimitFormSchema {
  return {
    name: limit.name,
    targetLabelId: limit.targetLabel.id,
    targetParentLabelId: limit.targetParentLabel?.id ?? null,
    limitItems: limit.limitItems.map((item) => ({
      id: item.id,
      limitFrom: item.limitFrom,
      limitTo: item.limitTo,
      parameter: item.parameter,
      operator: item.operator,
    })),
  };
}

const createDefaultValues: CreateLimitFormSchema = {
  name: "",
  targetLabelId: 0,
  targetParentLabelId: null,
  limitItems: [{ ...emptyLimitItem }],
};

export function useLimitForm(options: LimitFormOptions) {
  const [createLimit, { isLoading: isCreating }] = useCreateEvalLimitMutation();
  const [updateLimit, { isLoading: isUpdating }] = useUpdateEvalLimitMutation();

  const defaultValues = isUpdate(options)
    ? toFormValues(options.initialValues)
    : createDefaultValues;

  const form = useForm({
    defaultValues: defaultValues satisfies CreateLimitFormSchema as CreateLimitFormSchema,
    validators: {
      onChange: createLimitFormSchema,
      onSubmit: createLimitFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (isUpdate(options)) {
        await updateLimit({ projectId: options.projectId, testCaseId: options.testCaseId, limitId: options.limitId, body: value }).unwrap();
      } else {
        await createLimit({ projectId: options.projectId, testCaseId: options.testCaseId, body: value }).unwrap();
      }
      options.onSuccess();
    },
  });

  return { form, isSubmitting: isCreating || isUpdating };
}
