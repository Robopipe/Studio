import { EvalTestCaseThreshold, EvalThreshold } from "@repo/schema";
import { Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/modules/shadcn/ui/button";
import {
  useGetEvalThresholdsQuery,
  useCreateEvalThresholdMutation,
  useUpdateEvalThresholdMutation,
  useDeleteEvalThresholdMutation,
} from "../../api/evaluationApi";
import { AddEvaluationItemModal } from "./AddEvaluationItemModal";
import { EditEvaluationItemModal } from "./EditEvaluationItemModal";
import { EvaluationItemCard } from "./EvaluationItemCard";

export interface EvaluationThresholdsPageProps {
  projectId: number;
  configId: number;
}

type ModalContext = "master" | { testCaseId: string };

interface EditModalState {
  context: ModalContext;
  threshold: EvalThreshold;
}

export function EvaluationThresholdsPage({
  projectId,
  configId,
}: EvaluationThresholdsPageProps) {
  const { data: serverData } = useGetEvalThresholdsQuery({ projectId, configId });
  const serverTestCases = serverData?.testCases ?? [];
  const serverMaster = serverData?.master ?? [];

  const [createThreshold] = useCreateEvalThresholdMutation();
  const [updateThreshold] = useUpdateEvalThresholdMutation();
  const [deleteThreshold] = useDeleteEvalThresholdMutation();

  // Local overrides for threshold values changed via slider drag (thresholdId -> value)
  const [localValues, setLocalValues] = useState<Record<string, number>>({});

  // Reset local overrides when server data changes (after save or refetch)
  useEffect(() => {
    setLocalValues({});
  }, [serverData]);

  // Merge server data with local slider overrides
  const testCasesWithThresholds: EvalTestCaseThreshold[] = useMemo(
    () =>
      serverTestCases.map((tc) => ({
        ...tc,
        thresholds: tc.thresholds.map((t) => ({
          ...t,
          value: localValues[t.id] ?? t.value,
        })),
      })),
    [serverTestCases, localValues],
  );

  const masterThresholds: EvalThreshold[] = useMemo(
    () =>
      serverMaster.map((t) => ({
        ...t,
        value: localValues[t.id] ?? t.value,
      })),
    [serverMaster, localValues],
  );

  const [addModalContext, setAddModalContext] = useState<ModalContext | null>(null);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    if (!addModalContext) return;
    await createThreshold({
      projectId,
      configId,
      testCaseId: addModalContext === "master" ? undefined : addModalContext.testCaseId,
      body: data,
    }).unwrap();
    setAddModalContext(null);
  };

  const handleEditThreshold = async (data: {
    name: string;
    color: string;
  }) => {
    if (!editModal) return;
    const currentValue = localValues[editModal.threshold.id] ?? editModal.threshold.value;
    await updateThreshold({
      projectId,
      configId,
      thresholdId: editModal.threshold.id,
      body: { name: data.name, color: data.color, value: currentValue },
    }).unwrap();
    setEditModal(null);
  };

  const handleDeleteThreshold = async () => {
    if (!editModal) return;
    await deleteThreshold({
      projectId,
      configId,
      thresholdId: editModal.threshold.id,
    }).unwrap();
    setEditModal(null);
  };

  const hasChanges = Object.keys(localValues).length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const allServerThresholds = [
        ...serverTestCases.flatMap((tc) => tc.thresholds),
        ...serverMaster,
      ];
      const updates = Object.entries(localValues).map(
        ([thresholdId, newValue]) => {
          const original = allServerThresholds.find((t) => t.id === thresholdId);
          if (original) {
            return updateThreshold({
              projectId,
              configId,
              thresholdId,
              body: {
                name: original.name,
                color: original.color,
                value: newValue,
              },
            }).unwrap();
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
          Master evaluation
        </h2>

        <EvaluationItemCard
          name="Master evaluation"
          thresholds={masterThresholds}
          onEditThreshold={(thresholdId) => {
            const threshold = masterThresholds.find((t) => t.id === thresholdId);
            if (threshold) {
              setEditModal({ context: "master", threshold });
            }
          }}
          onAddThreshold={() => setAddModalContext("master")}
          onThresholdValueChange={handleSliderValueChange}
        />

        <h2 className="text-[10px] font-bold uppercase leading-4 tracking-[1px] text-foreground mt-4">
          Evaluation items
        </h2>

        <div className="flex flex-col gap-2">
          {testCasesWithThresholds.map((testCase) => (
            <EvaluationItemCard
              key={testCase.id}
              name={testCase.name}
              thresholds={testCase.thresholds}
              onEditThreshold={(thresholdId) => {
                const threshold = testCase.thresholds.find(
                  (t) => t.id === thresholdId,
                );
                if (threshold) {
                  setEditModal({ context: { testCaseId: testCase.id }, threshold });
                }
              }}
              onAddThreshold={() => setAddModalContext({ testCaseId: testCase.id })}
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
        open={addModalContext !== null}
        onOpenChange={(open) => {
          if (!open) setAddModalContext(null);
        }}
        onSave={handleAddThreshold}
      />

      <EditEvaluationItemModal
        open={editModal !== null}
        onOpenChange={(open) => {
          if (!open) setEditModal(null);
        }}
        onSave={handleEditThreshold}
        onDelete={handleDeleteThreshold}
        canDelete={editModal?.threshold.value !== 1}
        initialName={editModal?.threshold.name ?? ""}
        initialColor={editModal?.threshold.color ?? "#22c55e"}
      />
    </div>
  );
}
