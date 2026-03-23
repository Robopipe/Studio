import { useAppForm } from "@/core/form";
import { EvalLogicNode, EvalTestCaseDetail } from "@repo/schema";
import {
  useCreateEvalTestCaseMutation,
  useUpdateEvalTestCaseMutation,
} from "../../api/evaluationApi";
import { type CreateTestCaseFormSchema } from "../../types/createTestCaseForm.schema";
import { testCaseFormOptions } from "./testCaseForm.options";

type CreateOptions = {
  projectId: number;
  configId: number;
  testCaseId?: never;
  initialValues?: never;
  getLogicNodes?: never;
  onSuccess: () => void;
};

type UpdateOptions = {
  projectId: number;
  configId: number;
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

function toFormValues(testCase: EvalTestCaseDetail): CreateTestCaseFormSchema {
  return {
    name: testCase.name,
    type: testCase.type,
    severity: testCase.severity,
  };
}

export function useTestCaseForm(options: TestCaseFormOptions) {
  const [createTestCase, { isLoading: isCreating }] =
    useCreateEvalTestCaseMutation();
  const [updateTestCase, { isLoading: isUpdating }] =
    useUpdateEvalTestCaseMutation();

  const defaultValues = isUpdate(options)
    ? toFormValues(options.initialValues)
    : testCaseFormOptions.defaultValues;

  const form = useAppForm({
    ...testCaseFormOptions,
    defaultValues,
    onSubmit: async ({ value }) => {
      if (isUpdate(options)) {
        await updateTestCase({
          projectId: options.projectId,
          configId: options.configId,
          testCaseId: options.testCaseId,
          body: { ...value, logicNodes: options.getLogicNodes() },
        }).unwrap();
      } else {
        await createTestCase({
          projectId: options.projectId,
          configId: options.configId,
          body: value,
        }).unwrap();
      }
      options.onSuccess();
    },
  });

  return { form, isSubmitting: isCreating || isUpdating };
}
