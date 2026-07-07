import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/modules/shadcn/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/modules/shadcn/ui/tabs";

import { AnnotationTypeSelector } from "./AnnotationTypeSelector";
import { ConfidenceReportSection } from "./ConfidenceReportSection";
import { EmptyState } from "./EmptyState";
import { InstancesChart } from "./InstancesChart";
import { SizesChart } from "./SizesChart";
import { useDatasetStats } from "./useDatasetStats";

export interface AnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AnalyticsDialog = ({
  open,
  onOpenChange,
}: AnalyticsDialogProps) => {
  const {
    data,
    isLoading,
    isError,
    requestTypes,
    toggleType,
    hasGeometricType,
    hasAnyAreaData,
  } = useDatasetStats(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-215">
        <DialogHeader>
          <DialogTitle>Dataset Analytics</DialogTitle>
        </DialogHeader>
        {/* Charts */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <DialogTitle>Statistics</DialogTitle>

          {/* Annotation type selector */}
          <AnnotationTypeSelector
            availableTypes={data?.availableTypes}
            selectedTypes={requestTypes}
            onToggle={toggleType}
          />
          {isLoading && (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          )}
          {isError && (
            <div className="flex h-64 items-center justify-center text-sm text-red-500">
              Failed to load analytics. Please try again.
            </div>
          )}
          {data && !isLoading && !isError && (
            <Tabs defaultValue="instances">
              <TabsList variant="line" className="shrink-0">
                <TabsTrigger value="instances">Instances</TabsTrigger>
                <TabsTrigger value="sizes">Sizes</TabsTrigger>
              </TabsList>

              <TabsContent value="instances" className="pt-4">
                {data.labels.length === 0 ? (
                  <EmptyState message="No labels found for this project." />
                ) : (
                  <InstancesChart labels={data.labels} />
                )}
              </TabsContent>

              <TabsContent value="sizes" className="pt-4">
                {!hasGeometricType ? (
                  <EmptyState message="Select bounding boxes or polygons to see size data." />
                ) : !hasAnyAreaData ? (
                  <EmptyState message="No geometric annotations found for the selected types." />
                ) : (
                  <SizesChart labels={data.labels} />
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Confidence Report section — always visible regardless of stats loading state */}
          <ConfidenceReportSection />
        </div>
      </DialogContent>
    </Dialog>
  );
};
