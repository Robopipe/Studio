import { useAppDispatch } from "@/hooks/redux";
import { Badge } from "@/modules/shadcn/ui/badge";
import { Switch } from "@/modules/shadcn/ui/switch";
import { EvalTestCase } from "@repo/schema";
import { useState } from "react";
import {
  evaluationApi,
  useUpdateEvalTestCaseMutation,
} from "../../api/evaluationApi";

interface TestCaseEnabledSwitchProps {
  testCase: EvalTestCase;
  projectId: number;
  configId: number;
}

export function TestCaseEnabledSwitch({
  testCase,
  projectId,
  configId,
}: TestCaseEnabledSwitchProps) {
  const dispatch = useAppDispatch();
  const [updateTestCase] = useUpdateEvalTestCaseMutation();
  const [pending, setPending] = useState(false);

  const handleToggle = async (next: boolean) => {
    setPending(true);
    const patchResult = dispatch(
      evaluationApi.util.updateQueryData(
        "getEvalTestCases",
        { projectId, configId },
        (draft) => {
          const cached = draft.find((entry) => entry.id === testCase.id);
          if (cached) cached.enabled = next;
        },
      ),
    );

    try {
      await updateTestCase({
        projectId,
        configId,
        testCaseId: testCase.id,
        body: {
          name: testCase.name,
          type: testCase.type,
          severity: testCase.severity,
          enabled: next,
        },
      }).unwrap();
    } catch {
      patchResult.undo();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={testCase.enabled}
        onCheckedChange={handleToggle}
        disabled={pending}
        aria-label={testCase.enabled ? "Disable test case" : "Enable test case"}
      />
      {testCase.enabled ? (
        <Badge>Enabled</Badge>
      ) : (
        <Badge variant="secondary">Disabled</Badge>
      )}
    </div>
  );
}
