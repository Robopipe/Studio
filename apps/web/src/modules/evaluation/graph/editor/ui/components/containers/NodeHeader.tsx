import { GRID } from "@/modules/evaluation/graph/editor/constants";
import { IssueTooltip } from "@/modules/evaluation/graph/editor/ui/components/IssueTooltip";
import { Label } from "@/modules/evaluation/graph/editor/ui/components/Label";
import type { ValidationIssue } from "@/modules/evaluation/graph/editor/validation/types";
import type { ReactNode } from "react";

type Props = {
  label: ReactNode;
  labelHeight: number;
  issues: ValidationIssue[];
  headerRight?: ReactNode;
};

export const NodeHeader = ({
  label,
  labelHeight,
  issues,
  headerRight,
}: Props) => (
  <div
    className="flex items-center border-zinc-200 border-b-2"
    style={{ height: `${labelHeight * GRID}px` }}
  >
    <span className="flex flex-1 items-center px-2">
      <Label>{label}</Label>
      <div className="flex flex-grow" />
      <div className="flex flex-row items-center gap-2">
        {headerRight}
        <div className="flex flex-row gap-1">
          <IssueTooltip issues={issues} level="warning" />
          <IssueTooltip issues={issues} level="error" />
        </div>
      </div>
    </span>
  </div>
);
