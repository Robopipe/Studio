import { Button } from "@/modules/shadcn/ui/button";
import { Card, CardContent, CardHeader } from "@/modules/shadcn/ui/card";
import { Separator } from "@/modules/shadcn/ui/separator";
import { DataTable } from "@/modules/ui/components/Table";
import { EvalLimitDetail, EvalTestCaseDetail } from "@repo/schema";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { CreateLimitModal } from "../CreateLimit";
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
  const testCaseLimits = limits.filter((l) =>
    testCase.limits.some((tcl) => tcl.id === l.id),
  );

  const handleEditLimit = (limit: EvalLimitDetail) => {
    // TODO: open edit limit modal
    console.log("Edit limit", limit.id);
  };

  const handleDeleteLimit = (limit: EvalLimitDetail) => {
    // TODO: open delete confirm dialog
    console.log("Delete limit", limit.id);
  };

  const columns = useLimitColumns(handleEditLimit, handleDeleteLimit);

  return (
    <Card size="sm">
      <CardHeader className="items-center gap-3 grid-cols-[max-content_max-content_max-content]">
        <span className="text-sm font-semibold">{testCase.name}</span>
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
    </Card>
  );
}
