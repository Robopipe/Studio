import { Button } from "@/modules/shadcn/ui/button";
import { XIcon } from "lucide-react";
import type { EvaluationRecord } from "../../types";

interface ReportDetailPanelProps {
  record: EvaluationRecord;
  onClose: () => void;
}

export const ReportDetailPanel = ({
  record,
  onClose,
}: ReportDetailPanelProps) => {
  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-border bg-white">
      <div className="flex items-center justify-between border-b border-border p-4">
        <span className="text-sm font-semibold">{record.testCase}</span>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onClose}
          aria-label="Close detail"
        >
          <XIcon />
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
        Detail view coming soon
      </div>
    </aside>
  );
};
