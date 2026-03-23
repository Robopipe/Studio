import { useAppForm } from "@/core/form";
import { EvalLimitDetail } from "@repo/schema";
import {
  useCreateEvalLimitMutation,
  useUpdateEvalLimitMutation,
} from "../../api/evaluationApi";
import { type CreateLimitFormSchema } from "../../types/createLimitForm.schema";
import { limitFormOptions } from "./limitForm.options";

type CreateOptions = {
  projectId: number;
  configId: number;
  testCaseId: string;
  onSuccess: () => void;
};

type UpdateOptions = {
  projectId: number;
  configId: number;
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

export function useLimitForm(options: LimitFormOptions) {
  const [createLimit, { isLoading: isCreating }] = useCreateEvalLimitMutation();
  const [updateLimit, { isLoading: isUpdating }] = useUpdateEvalLimitMutation();

  const defaultValues = isUpdate(options)
    ? toFormValues(options.initialValues)
    : limitFormOptions.defaultValues;

  const form = useAppForm({
    ...limitFormOptions,
    defaultValues,
    onSubmit: async ({ value }) => {
      if (isUpdate(options)) {
        await updateLimit({
          projectId: options.projectId,
          configId: options.configId,
          testCaseId: options.testCaseId,
          limitId: options.limitId,
          body: value,
        }).unwrap();
      } else {
        await createLimit({
          projectId: options.projectId,
          configId: options.configId,
          testCaseId: options.testCaseId,
          body: value,
        }).unwrap();
      }
      options.onSuccess();
    },
  });

  return { form, isSubmitting: isCreating || isUpdating };
}
