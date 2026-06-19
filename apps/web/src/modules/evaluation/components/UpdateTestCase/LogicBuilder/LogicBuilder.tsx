import { Separator } from "@/modules/shadcn/ui/separator";
import { EvalLimit, EvalTestCaseDetail } from "@repo/schema";
import { GroupIcon } from "lucide-react";
import { useLayoutEffect } from "react";
import { LimitsPanel } from "./LimitsPanel";
import { LogicBuilderProvider } from "./LogicBuilderContext";
import { LogicNodeList } from "./LogicNodeList";
import { LogicBuilderState, useLogicBuilder } from "./useLogicBuilder.hook";

interface LogicBuilderProps {
  testCase: EvalTestCaseDetail;
  availableLimits: EvalLimit[];
  /** Called after every render so the parent can read the latest state at submit time */
  builderRef?: (state: LogicBuilderState) => void;
}

export function LogicBuilder({
  testCase,
  availableLimits,
  builderRef,
}: LogicBuilderProps) {
  const builder = useLogicBuilder(testCase.logicNodes, testCase);

  useLayoutEffect(() => {
    builderRef?.(builder);
  });

  const handleCanvasClick = () => {
    builder.clearSelection();
  };

  return (
    <LogicBuilderProvider value={{ ...builder, testCase, availableLimits }}>
      <div className="flex flex-col rounded-lg border border-border overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
          <span className="text-xs font-semibold text-muted-foreground">
            Logic
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            {builder.selectedIds.size > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {builder.selectedIds.size} selected
              </span>
            )}
            <button
              type="button"
              disabled={!builder.canGroup}
              onClick={builder.groupSelected}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-default enabled:hover:bg-muted enabled:cursor-pointer"
            >
              <GroupIcon className="size-3.5" />
              Group selected
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div
          className="min-h-[80px] flex-1 p-4 cursor-default"
          onClick={handleCanvasClick}
        >
          <LogicNodeList nodes={builder.nodes} groupId={null} />
        </div>

        <Separator />

        {/* Limits panel */}
        <div className="p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Available checks
          </p>
          <LimitsPanel />
        </div>
      </div>
    </LogicBuilderProvider>
  );
}
