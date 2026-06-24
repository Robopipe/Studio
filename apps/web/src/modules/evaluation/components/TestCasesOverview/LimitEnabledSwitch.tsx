import { useAppDispatch } from "@/hooks/redux";
import { Badge } from "@/modules/shadcn/ui/badge";
import { Switch } from "@/modules/shadcn/ui/switch";
import { EvalLimit, EvalLimitDetail } from "@repo/schema";
import { useState } from "react";
import {
  evaluationApi,
  useLazyGetEvalLimitQuery,
  useUpdateEvalLimitMutation,
} from "../../api/evaluationApi";

interface LimitEnabledSwitchProps {
  limit: EvalLimit;
  projectId: number;
  configId: number;
  testCaseId: string;
}

function detailToUpdateBody(detail: EvalLimitDetail, enabled: boolean) {
  return {
    name: detail.name,
    severity: detail.severity,
    enabled,
    targetLabelId: detail.targetLabel.id,
    targetParentLabelId: detail.targetParentLabel?.id ?? null,
    limitItems: detail.limitItems.map((item) => ({
      id: item.id,
      limitFrom: item.limitFrom,
      limitTo: item.limitTo,
      parameter: item.parameter,
      operator: item.operator,
      quantifierType: item.quantifierType,
      quantifierUnit: item.quantifierUnit,
      quantifierValue: item.quantifierValue,
      targetEdge: item.targetEdge,
      parentEdge: item.parentEdge,
    })),
  };
}

export function LimitEnabledSwitch({
  limit,
  projectId,
  configId,
  testCaseId,
}: LimitEnabledSwitchProps) {
  const dispatch = useAppDispatch();
  const [fetchDetail] = useLazyGetEvalLimitQuery();
  const [updateLimit] = useUpdateEvalLimitMutation();
  const [pending, setPending] = useState(false);

  const handleToggle = async (next: boolean) => {
    setPending(true);
    const patchResult = dispatch(
      evaluationApi.util.updateQueryData(
        "getEvalLimits",
        { projectId, configId, testCaseId },
        (draft) => {
          const cached = draft.find((entry) => entry.id === limit.id);
          if (cached) cached.enabled = next;
        },
      ),
    );

    try {
      const detail = await fetchDetail(
        { projectId, configId, testCaseId, limitId: limit.id },
        false,
      ).unwrap();

      await updateLimit({
        projectId,
        configId,
        testCaseId,
        limitId: limit.id,
        body: detailToUpdateBody(detail, next),
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
        checked={limit.enabled}
        onCheckedChange={handleToggle}
        disabled={pending}
        aria-label={limit.enabled ? "Disable limit" : "Enable limit"}
      />
      {limit.enabled ? (
        <Badge>Enabled</Badge>
      ) : (
        <Badge variant="secondary">Disabled</Badge>
      )}
    </div>
  );
}
