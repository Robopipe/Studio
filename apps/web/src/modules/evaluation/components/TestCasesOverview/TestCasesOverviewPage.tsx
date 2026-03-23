import { Button } from "@/modules/shadcn/ui/button";
import { Skeleton } from "@/modules/shadcn/ui/skeleton";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useGetEvalTestCasesQuery } from "../../api/evaluationApi";
import { CreateTestCaseModal } from "../CreateTestCase";
import { EmptyTestCasesState } from "./EmptyTestCasesState";
import { TestCaseSection } from "./TestCaseSection";

export type TestCasesOverviewPageProps = {
  projectId: number;
  dashboardConfigurationId: number;
};

export const TestCasesOverviewPage = ({
  projectId,
  dashboardConfigurationId,
}: TestCasesOverviewPageProps) => {
  const {
    data: testCases = [],
    isLoading,
    error,
  } = useGetEvalTestCasesQuery({ projectId, configId: dashboardConfigurationId });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-destructive">
          Failed to load evaluation data. Please try again later.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-7 w-28" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-45 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <h5 className="text-base font-semibold">All Test Cases</h5>
        <Button size="lg" onClick={() => setIsCreateModalOpen(true)}>
          <PlusIcon className="size-4" />
          Add Test case
        </Button>
      </div>

      {testCases.map((tc) => (
        <TestCaseSection key={tc.id} testCase={tc} projectId={projectId} configId={dashboardConfigurationId} />
      ))}

      {testCases.length === 0 && (
        <EmptyTestCasesState onAddTestCase={() => setIsCreateModalOpen(true)} />
      )}

      {isCreateModalOpen && (
        <CreateTestCaseModal
          projectId={projectId}
          configId={dashboardConfigurationId}
          open={true}
          onOpenChange={setIsCreateModalOpen}
        />
      )}
    </div>
  );
};
