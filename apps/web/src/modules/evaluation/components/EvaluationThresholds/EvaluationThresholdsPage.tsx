import { EvalTestCaseThreshold, EvalThreshold } from "@repo/schema";
import { Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/modules/shadcn/ui/button";
import {
  useGetEvalThresholdsQuery,
  useCreateEvalThresholdMutation,
  useUpdateEvalThresholdMutation,
} from "../../api/evaluationApi";
import { AddEvaluationItemModal } from "./AddEvaluationItemModal";
import { EditEvaluationItemModal } from "./EditEvaluationItemModal";
import { EvaluationItemCard } from "./EvaluationItemCard";

export interface EvaluationThresholdsPageProps {
  projectId: number;
}

interface EditModalState {
  testCaseId: string;
  threshold: EvalThreshold;
}

export function EvaluationThresholdsPage({
  projectId,
}: EvaluationThresholdsPageProps) {
  const { data: serverData = [] } = useGetEvalThresholdsQuery({ projectId });

  const [createThreshold] = useCreateEvalThresholdMutation();
  const [updateThreshold] = useUpdateEvalThresholdMutation();

  // Local overrides for threshold values changed via slider drag (thresholdId -> value)
  const [localValues, setLocalValues] = useState<Record<string, number>>({});

  // Reset local overrides when server data changes (after save or refetch)
  useEffect(() => {
    setLocalValues({});
  }, [serverData]);

  // Merge server data with local slider overrides
  const testCasesWithThresholds: EvalTestCaseThreshold[] = useMemo(
    () =>
      serverData.map((tc) => ({
        ...tc,
        thresholds: tc.thresholds.map((t) => ({
          ...t,
          value: localValues[t.id] ?? t.value,
        })),
      })),
    [serverData, localValues],
  );

  const [dashboardFlags, setDashboardFlags] = useState<
    Record<string, boolean>
  >({});
  const [addModalTestCaseId, setAddModalTestCaseId] = useState<string | null>(
    null,
  );
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleDashboardChange = (testCaseId: string, checked: boolean) => {
    setDashboardFlags((prev) => ({ ...prev, [testCaseId]: checked }));
  };

  const handleSliderValueChange = useCallback(
    (thresholdId: string, newValue: number) => {
      setLocalValues((prev) => ({ ...prev, [thresholdId]: newValue }));
    },
    [],
  );

  const handleAddThreshold = async (data: {
    name: string;
    color: string;
    value: number;
  }) => {
    if (!addModalTestCaseId) return;
    await createThreshold({
      projectId,
      testCaseId: addModalTestCaseId,
      body: data,
    }).unwrap();
    setAddModalTestCaseId(null);
  };

  const handleEditThreshold = async (data: {
    name: string;
    color: string;
  }) => {
    if (!editModal) return;
    const currentValue =
      localValues[editModal.threshold.id] ?? editModal.threshold.value;
    await updateThreshold({
      projectId,
      testCaseId: editModal.testCaseId,
      thresholdId: editModal.threshold.id,
      body: { name: data.name, color: data.color, value: currentValue },
    }).unwrap();
    setEditModal(null);
  };

  const hasChanges = Object.keys(localValues).length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const updates = Object.entries(localValues).map(
        ([thresholdId, newValue]) => {
          // Find which test case owns this threshold
          for (const tc of serverData) {
            const original = tc.thresholds.find((t) => t.id === thresholdId);
            if (original) {
              return updateThreshold({
                projectId,
                testCaseId: tc.id,
                thresholdId,
                body: {
                  name: original.name,
                  color: original.color,
                  value: newValue,
                },
              }).unwrap();
            }
          }
          return Promise.resolve();
        },
      );
      await Promise.all(updates);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="flex flex-col gap-2">
        <h2 className="text-[10px] font-bold uppercase leading-4 tracking-[1px] text-foreground">
          Evaluation items
        </h2>

        <div className="flex flex-col gap-2">
          {testCasesWithThresholds.map((testCase) => (
            <EvaluationItemCard
              key={testCase.id}
              testCase={testCase}
              displayOnDashboard={dashboardFlags[testCase.id] ?? false}
              onDisplayOnDashboardChange={(checked) =>
                handleDashboardChange(testCase.id, checked)
              }
              onEditThreshold={(thresholdId) => {
                const threshold = testCase.thresholds.find(
                  (t) => t.id === thresholdId,
                );
                if (threshold) {
                  setEditModal({ testCaseId: testCase.id, threshold });
                }
              }}
              onAddThreshold={() => setAddModalTestCaseId(testCase.id)}
              onThresholdValueChange={handleSliderValueChange}
            />
          ))}

          {testCasesWithThresholds.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No test cases found. Create test cases first to configure
              evaluation thresholds.
            </p>
          )}
        </div>

        <div className="flex flex-col items-end">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Save className="size-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <AddEvaluationItemModal
        open={addModalTestCaseId !== null}
        onOpenChange={(open) => {
          if (!open) setAddModalTestCaseId(null);
        }}
        onSave={handleAddThreshold}
      />

      <EditEvaluationItemModal
        open={editModal !== null}
        onOpenChange={(open) => {
          if (!open) setEditModal(null);
        }}
        onSave={handleEditThreshold}
        initialName={editModal?.threshold.name ?? ""}
        initialColor={editModal?.threshold.color ?? "#22c55e"}
      />
    </div>
  );
}
