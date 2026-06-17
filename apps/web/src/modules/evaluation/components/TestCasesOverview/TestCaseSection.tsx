import { cn } from "@/lib/utils";
import { DeleteLimitDialog } from "@/modules/dashboard/components/DeleteLimitDialog";
import { GraphEditor } from "@/modules/evaluation/components/GraphEditor/GraphEditor";
import { Button } from "@/modules/shadcn/ui/button";
import { Card, CardContent, CardHeader } from "@/modules/shadcn/ui/card";
import { Separator } from "@/modules/shadcn/ui/separator";
import { DataTable } from "@/modules/ui/components/Table";
import { EvalLimit, EvalTestCase } from "@repo/schema";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import {
  useDeleteEvalLimitMutation,
  useDeleteEvalTestCaseMutation,
  useGetEvalLimitQuery,
  useGetEvalLimitsQuery,
  useGetEvalTestCaseQuery,
} from "../../api/evaluationApi";
import { CreateLimitModal, UpdateLimitModal } from "../CreateUpdateLimit";
import { UpdateTestCaseModal } from "../UpdateTestCase";
import { TestCaseEnabledSwitch } from "./TestCaseEnabledSwitch";
import { useLimitColumns } from "./useLimitColumns.hook";

interface TestCaseSectionProps {
  testCase: EvalTestCase;
  projectId: number;
  configId: number;
}

type DeleteState =
  | { type: "confirm"; limitId: string }
  | { type: "blocked"; limitId: string }
  | null;

type ViewMode = "table" | "graph";

export function TestCaseSection({
  testCase,
  projectId,
  configId,
}: TestCaseSectionProps) {
  const { data: limits = [] } = useGetEvalLimitsQuery({
    projectId,
    configId,
    testCaseId: testCase.id,
  });
  const [isCreateLimitOpen, setIsCreateLimitOpen] = useState(false);
  const [limitToEditId, setLimitToEditId] = useState<string | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState>(null);
  const [isEditTestCaseOpen, setIsEditTestCaseOpen] = useState(false);
  const [isDeleteTestCaseOpen, setIsDeleteTestCaseOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const { data: limitToEdit } = useGetEvalLimitQuery(
    { projectId, configId, testCaseId: testCase.id, limitId: limitToEditId! },
    { skip: !limitToEditId },
  );
  const { data: testCaseDetail } = useGetEvalTestCaseQuery(
    { projectId, configId, testCaseId: testCase.id },
    { skip: !isEditTestCaseOpen },
  );

  const [deleteEvalLimit, { isLoading: isDeleting }] =
    useDeleteEvalLimitMutation();
  const [deleteEvalTestCase, { isLoading: isDeletingTC }] =
    useDeleteEvalTestCaseMutation();

  const handleDeleteTestCase = () => {
    deleteEvalTestCase({ projectId, configId, testCaseId: testCase.id })
      .unwrap()
      .then(() => setIsDeleteTestCaseOpen(false));
  };

  const handleEditLimit = (limit: EvalLimit) => {
    setLimitToEditId(limit.id);
  };

  const handleDeleteLimit = (limit: EvalLimit) => {
    setDeleteState({ type: "confirm", limitId: limit.id });
  };

  const handleConfirmDelete = () => {
    if (!deleteState) return;
    deleteEvalLimit({
      projectId,
      configId,
      testCaseId: testCase.id,
      limitId: deleteState.limitId,
    })
      .unwrap()
      .then((result) => {
        if (result.deleted) {
          setDeleteState(null);
        } else {
          setDeleteState({ type: "blocked", limitId: deleteState.limitId });
        }
      });
  };

  const columns = useLimitColumns({
    projectId,
    configId,
    testCaseId: testCase.id,
    onEdit: handleEditLimit,
    onDelete: handleDeleteLimit,
  });

  return (
    <Card size="sm">
      <CardHeader className="relative flex flex-row items-center gap-3">
        <p className="text-sm font-semibold shrink-0">{testCase.name}</p>
        {viewMode === "table" && (
          <>
            <Separator orientation="vertical" className="h-4 my-auto" />
            <Button
              variant="link"
              size="sm"
              className="gap-1 p-0 text-sm w-fit"
              onClick={() => setIsCreateLimitOpen(true)}
            >
              <PlusIcon />
              Add limit
            </Button>
          </>
        )}

        {/* Centered independently of the side groups so it never shifts when the
            left/right buttons change between table and graph view. */}
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-md bg-muted p-0.5">
          {(["table", "graph"] as const).map((mode) => (
            <Button
              key={mode}
              variant="ghost"
              size="sm"
              aria-pressed={viewMode === mode}
              className={cn(
                "capitalize text-muted-foreground hover:bg-transparent hover:text-foreground",
                viewMode === mode &&
                  "bg-background text-foreground shadow-xs hover:bg-background",
              )}
              onClick={() => setViewMode(mode)}
            >
              {mode}
            </Button>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {viewMode === "table" && (
            <>
              <TestCaseEnabledSwitch
                testCase={testCase}
                projectId={projectId}
                configId={configId}
              />
              <Separator orientation="vertical" className="h-4 my-auto" />
              <Button
                variant="secondary"
                size="icon-sm"
                className=""
                aria-label="Edit test case"
                onClick={() => setIsEditTestCaseOpen(true)}
              >
                <PencilIcon className="size-4" />
              </Button>
            </>
          )}
          <Button
            variant="destructive"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            aria-label="Delete test case"
            onClick={() => setIsDeleteTestCaseOpen(true)}
          >
            <Trash2Icon className="size-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === "table" ? (
          <DataTable data={limits} columns={columns} enableRowSelection />
        ) : (
          <GraphEditor projectId={projectId} />
        )}
      </CardContent>

      {isCreateLimitOpen && (
        <CreateLimitModal
          projectId={projectId}
          configId={configId}
          testCaseId={testCase.id}
          open={true}
          onOpenChange={setIsCreateLimitOpen}
        />
      )}

      {limitToEditId && limitToEdit && (
        <UpdateLimitModal
          projectId={projectId}
          configId={configId}
          testCaseId={testCase.id}
          limit={limitToEdit}
          open={true}
          onOpenChange={(open) => !open && setLimitToEditId(null)}
        />
      )}

      {isEditTestCaseOpen && testCaseDetail && (
        <UpdateTestCaseModal
          projectId={projectId}
          configId={configId}
          testCase={testCaseDetail}
          open={true}
          onOpenChange={(open) => !open && setIsEditTestCaseOpen(false)}
        />
      )}

      {isDeleteTestCaseOpen && (
        <DeleteLimitDialog
          title="Do you really want to delete this test case."
          description="This action can not be undone. All limits associated with this test case will be removed."
          confirmLabel="Delete this test case anyway"
          onCancel={() => setIsDeleteTestCaseOpen(false)}
          onConfirm={handleDeleteTestCase}
          isLoading={isDeletingTC}
        />
      )}

      {deleteState?.type === "confirm" && (
        <DeleteLimitDialog
          onCancel={() => setDeleteState(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />
      )}

      {deleteState?.type === "blocked" && (
        <DeleteLimitDialog
          title="Cannot delete this limit"
          description="This limit is used in the evaluation logic. Remove it from the evaluation logic first, then you can delete it."
          confirmLabel="OK"
          onCancel={() => setDeleteState(null)}
          onConfirm={() => setDeleteState(null)}
        />
      )}
    </Card>
  );
}
