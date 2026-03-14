import { Button } from "@/modules/shadcn/ui/button";
import { Skeleton } from "@/modules/shadcn/ui/skeleton";
import { PlusIcon, SaveIcon } from "lucide-react";
import { useState } from "react";
import {
  useGetEvalLimitsQuery,
  useGetEvalTestCasesQuery,
} from "../../api/evaluationApi";
import { CreateTestCaseModal } from "../CreateTestCase";
import { EmptyTestCasesState } from "./EmptyTestCasesState";
import { TestCaseSection } from "./TestCaseSection";

export type TestCasesOverviewPageProps = {
  projectId: number;
};

export const TestCasesOverviewPage = ({
  projectId,
}: TestCasesOverviewPageProps) => {
  const {
    data: testCases = [],
    isLoading: isLoadingTestCases,
    error: testCasesError,
  } = useGetEvalTestCasesQuery({ projectId });
  const {
    data: limits = [],
    isLoading: isLoadingLimits,
    error: limitsError,
  } = useGetEvalLimitsQuery({ projectId });

  const isLoading = isLoadingTestCases || isLoadingLimits;
  const error = testCasesError || limitsError;
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
        <TestCaseSection
          key={tc.id}
          testCase={tc}
          limits={limits}
          projectId={projectId}
        />
      ))}

      {testCases.length === 0 && (
        <EmptyTestCasesState onAddTestCase={() => setIsCreateModalOpen(true)} />
      )}

      {testCases.length > 0 && (
        <>
          <hr className="border-border" />
          <div className="flex justify-end">
            <Button size="lg">
              <SaveIcon className="size-4 text-primary-foreground" />
              Save
            </Button>
          </div>
        </>
      )}

      <CreateTestCaseModal
        projectId={projectId}
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
};
