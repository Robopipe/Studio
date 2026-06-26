import { useAppDispatch } from "@/hooks/redux";
import { Badge } from "@/modules/shadcn/ui/badge";
import { Switch } from "@/modules/shadcn/ui/switch";
import { EvalLimit, EvalLimitDetail } from "@repo/schema";
import { useState } from "react";
import { useLimitDetail } from "../../api/evalSelectors";
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

  // Reuse the SSOT detail when the graph already loaded it — skips the detail fetch.
  const cachedDetail = useLimitDetail(
    { projectId, configId, testCaseId },
    limit.id,
  );

  const handleToggle = async (next: boolean) => {
    setPending(true);

    // Optimistically flip the row in both sources the table reads from (SSOT + list).
    // Either patch is a no-op if that entry isn't cached.
    const patchFull = dispatch(
      evaluationApi.util.updateQueryData(
        "getEvalTestCaseFull",
        { projectId, configId, testCaseId },
        (draft) => {
          const cached = draft.limits.find((entry) => entry.id === limit.id);
          if (cached) cached.enabled = next;
        },
      ),
    );
    const patchList = dispatch(
      evaluationApi.util.updateQueryData(
        "getEvalTestCases",
        { projectId, configId },
        (draft) => {
          const cached = draft
            .find((tc) => tc.id === testCaseId)
            ?.limits.find((entry) => entry.id === limit.id);
          if (cached) cached.enabled = next;
        },
      ),
    );

    try {
      const detail =
        cachedDetail ??
        (await fetchDetail(
          { projectId, configId, testCaseId, limitId: limit.id },
          false,
        ).unwrap());

      await updateLimit({
        projectId,
        configId,
        testCaseId,
        limitId: limit.id,
        body: detailToUpdateBody(detail, next),
      }).unwrap();
    } catch {
      patchFull.undo();
      patchList.undo();
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
        aria-label={limit.enabled ? "Disable check" : "Enable check"}
      />
      {limit.enabled ? (
        <Badge>Enabled</Badge>
      ) : (
        <Badge variant="secondary">Disabled</Badge>
      )}
    </div>
  );
}
