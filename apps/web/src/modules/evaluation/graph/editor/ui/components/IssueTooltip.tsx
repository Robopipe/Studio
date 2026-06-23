import type {
  ValidationIssue,
  ValidationIssueLevel,
} from "@/modules/evaluation/graph/editor/validation/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/modules/shadcn/ui/tooltip";
import { Info, TriangleAlert } from "lucide-react";

type Props = {
  issues: ValidationIssue[];
  level: ValidationIssueLevel;
};

export function IssueTooltip(props: Props) {
  const { issues, level } = props;
  const filteredIssues = issues.filter((issue) => issue.level === level);

  if (filteredIssues.length === 0) return <></>;

  return (
    <Tooltip>
      <TooltipTrigger delay={100}>
        {level === "error" ? (
          <TriangleAlert className="text-red-400" />
        ) : (
          <Info className="text-amber-400" />
        )}
      </TooltipTrigger>
      <TooltipContent side="right">
        <ul className="list-disc pl-4 text-xs">
          {filteredIssues.map((issue, index) => (
            <li key={`${issue.message}-${index}`}>
              <div>{issue.message}</div>

              {issue.description?.length ? (
                <ul className="mt-0.5 list-disc pl-4 text-xs text-white">
                  {issue.description.map((line, lineIndex) => (
                    <li key={`${line}-${lineIndex}`}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
