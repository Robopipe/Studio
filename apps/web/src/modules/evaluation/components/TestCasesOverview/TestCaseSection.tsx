import { DeleteLimitDialog } from "@/modules/dashboard/components/DeleteLimitDialog";
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
import { useLimitColumns } from "./useLimitColumns.hook";

interface TestCaseSectionProps {
  testCase: EvalTestCase;
  projectId: number;
}

export function TestCaseSection({
  testCase,
  projectId,
}: TestCaseSectionProps) {
  const { data: limits = [] } = useGetEvalLimitsQuery({
    projectId,
    testCaseId: testCase.id,
  });
  const [isCreateLimitOpen, setIsCreateLimitOpen] = useState(false);
  const [limitToEditId, setLimitToEditId] = useState<string | null>(null);
  const [limitToDeleteId, setLimitToDeleteId] = useState<string | null>(null);
  const [isEditTestCaseOpen, setIsEditTestCaseOpen] = useState(false);
  const [isDeleteTestCaseOpen, setIsDeleteTestCaseOpen] = useState(false);

  const { data: limitToEdit } = useGetEvalLimitQuery(
    { projectId, testCaseId: testCase.id, limitId: limitToEditId! },
    { skip: !limitToEditId },
  );
  const { data: testCaseDetail } = useGetEvalTestCaseQuery(
    { projectId, testCaseId: testCase.id },
    { skip: !isEditTestCaseOpen },
  );

  const [deleteEvalLimit, { isLoading: isDeleting }] =
    useDeleteEvalLimitMutation();
  const [deleteEvalTestCase, { isLoading: isDeletingTC }] =
    useDeleteEvalTestCaseMutation();

  const handleDeleteTestCase = () => {
    deleteEvalTestCase({ projectId, testCaseId: testCase.id })
      .unwrap()
      .then(() => setIsDeleteTestCaseOpen(false));
  };

  const handleEditLimit = (limit: EvalLimit) => {
    setLimitToEditId(limit.id);
  };

  const handleDeleteLimit = (limit: EvalLimit) => {
    setLimitToDeleteId(limit.id);
  };

  const handleConfirmDelete = () => {
    if (!limitToDeleteId) return;
    deleteEvalLimit({ projectId, testCaseId: testCase.id, limitId: limitToDeleteId })
      .unwrap()
      .then(() => setLimitToDeleteId(null));
  };

  const limitToDelete = limits.find((l) => l.id === limitToDeleteId) ?? null;
  const columns = useLimitColumns(handleEditLimit, handleDeleteLimit);

  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center gap-3">
        <p className="text-sm font-semibold shrink-0">{testCase.name}</p>
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
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button
            variant="secondary"
            size="icon-sm"
            className=""
            aria-label="Edit test case"
            onClick={() => setIsEditTestCaseOpen(true)}
          >
            <PencilIcon className="size-4" />
          </Button>
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
        <DataTable data={limits} columns={columns} enableRowSelection />
      </CardContent>

      <CreateLimitModal
        projectId={projectId}
        testCaseId={testCase.id}
        open={isCreateLimitOpen}
        onOpenChange={setIsCreateLimitOpen}
      />

      {limitToEdit && (
        <UpdateLimitModal
          projectId={projectId}
          testCaseId={testCase.id}
          limit={limitToEdit}
          open={true}
          onOpenChange={(open) => !open && setLimitToEditId(null)}
        />
      )}

      {isEditTestCaseOpen && testCaseDetail && (
        <UpdateTestCaseModal
          projectId={projectId}
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

      {limitToDelete && (
        <DeleteLimitDialog
          onCancel={() => setLimitToDeleteId(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />
      )}
    </Card>
  );
}
