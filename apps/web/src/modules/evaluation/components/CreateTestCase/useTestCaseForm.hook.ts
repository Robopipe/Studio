import { EvalLogicNode, EvalTestCaseDetail, EvalTestCaseSeverityEnum, EvalTestCaseTypeEnum } from "@repo/schema";
import { useForm } from "@tanstack/react-form";
import { useCreateEvalTestCaseMutation, useUpdateEvalTestCaseMutation } from "../../api/evaluationApi";
import { createTestCaseFormSchema, type CreateTestCaseFormSchema } from "../../types/createTestCaseForm.schema";

type CreateOptions = {
  projectId: number;
  testCaseId?: never;
  initialValues?: never;
  getLogicNodes?: never;
  onSuccess: () => void;
};

type UpdateOptions = {
  projectId: number;
  testCaseId: string;
  initialValues: EvalTestCaseDetail;
  /** Called at submit time to get the latest logic nodes from the builder */
  getLogicNodes: () => EvalLogicNode[];
  onSuccess: () => void;
};

export type TestCaseFormOptions = CreateOptions | UpdateOptions;

function isUpdate(options: TestCaseFormOptions): options is UpdateOptions {
  return "testCaseId" in options && options.testCaseId !== undefined;
}

const createDefaultValues: CreateTestCaseFormSchema = {
  name: "",
  type: EvalTestCaseTypeEnum.CHECK,
  severity: EvalTestCaseSeverityEnum.ALERT,
};

function toFormValues(testCase: EvalTestCaseDetail): CreateTestCaseFormSchema {
  return { name: testCase.name, type: testCase.type, severity: testCase.severity };
}

export function useTestCaseForm(options: TestCaseFormOptions) {
  const [createTestCase, { isLoading: isCreating }] = useCreateEvalTestCaseMutation();
  const [updateTestCase, { isLoading: isUpdating }] = useUpdateEvalTestCaseMutation();

  const form = useForm({
    defaultValues: isUpdate(options)
      ? toFormValues(options.initialValues)
      : createDefaultValues,
    validators: {
      onChange: createTestCaseFormSchema,
      onSubmit: createTestCaseFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (isUpdate(options)) {
        await updateTestCase({
          projectId: options.projectId,
          testCaseId: options.testCaseId,
          body: { ...value, logicNodes: options.getLogicNodes() },
        }).unwrap();
      } else {
        await createTestCase({ projectId: options.projectId, body: value }).unwrap();
      }
      options.onSuccess();
    },
  });

  return { form, isSubmitting: isCreating || isUpdating };
}
