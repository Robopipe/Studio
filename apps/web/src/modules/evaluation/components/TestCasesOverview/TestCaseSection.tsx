import { DeleteLimitDialog } from "@/modules/dashboard/components/DeleteLimitDialog";
import { Button } from "@/modules/shadcn/ui/button";
import { Card, CardContent, CardHeader } from "@/modules/shadcn/ui/card";
import { Separator } from "@/modules/shadcn/ui/separator";
import { DataTable } from "@/modules/ui/components/Table";
import { EvalLimitDetail, EvalTestCaseDetail } from "@repo/schema";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import {
  useDeleteEvalLimitMutation,
  useDeleteEvalTestCaseMutation,
} from "../../api/evaluationApi";
import { CreateLimitModal, UpdateLimitModal } from "../CreateUpdateLimit";
import { useLimitColumns } from "./useLimitColumns.hook";

interface TestCaseSectionProps {
  testCase: EvalTestCaseDetail;
  limits: EvalLimitDetail[];
  projectId: number;
}

export function TestCaseSection({
  testCase,
  limits,
  projectId,
}: TestCaseSectionProps) {
  const [isCreateLimitOpen, setIsCreateLimitOpen] = useState(false);
  const [limitToEdit, setLimitToEdit] = useState<EvalLimitDetail | null>(null);
  const [limitToDelete, setLimitToDelete] = useState<EvalLimitDetail | null>(
    null,
  );
  const [isDeleteTestCaseOpen, setIsDeleteTestCaseOpen] = useState(false);
  const [deleteEvalLimit, { isLoading: isDeleting }] =
    useDeleteEvalLimitMutation();
  const [deleteEvalTestCase, { isLoading: isDeletingTC }] =
    useDeleteEvalTestCaseMutation();

  const handleDeleteTestCase = () => {
    deleteEvalTestCase({ projectId, testCaseId: testCase.id })
      .unwrap()
      .then(() => setIsDeleteTestCaseOpen(false));
  };

  const testCaseLimits = limits.filter((l) =>
    testCase.limits.some((tcl) => tcl.id === l.id),
  );

  const handleEditLimit = (limit: EvalLimitDetail) => {
    setLimitToEdit(limit);
  };

  const handleDeleteLimit = (limit: EvalLimitDetail) => {
    setLimitToDelete(limit);
  };

  const handleConfirmDelete = () => {
    if (!limitToDelete) return;
    deleteEvalLimit({ projectId, limitId: limitToDelete.id })
      .unwrap()
      .then(() => setLimitToDelete(null));
  };

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
        <Button
          variant="destructive"
          size="icon-sm"
          className="ml-auto shrink-0 text-muted-foreground hover:text-destructive"
          aria-label="Delete test case"
          onClick={() => setIsDeleteTestCaseOpen(true)}
        >
          <Trash2Icon className="size-4 text-destructive" />
        </Button>
      </CardHeader>

      <CardContent>
        <DataTable data={testCaseLimits} columns={columns} enableRowSelection />
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
          limit={limitToEdit}
          open={true}
          onOpenChange={(open) => !open && setLimitToEdit(null)}
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
          onCancel={() => setLimitToDelete(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />
      )}
    </Card>
  );
}
