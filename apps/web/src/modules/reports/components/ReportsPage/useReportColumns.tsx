import { Button } from "@/modules/shadcn/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/modules/shadcn/ui/tooltip";
import { createSelectColumn } from "@/modules/ui/components/Table";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useMemo } from "react";
import type { EvaluationRecord } from "../../types";
import { formatDefect, formatDefects } from "../../utils/formatDefects";

const formatTimestamp = (value: string | null) =>
  value ? format(new Date(value), "dd.MM.yyyy HH:mm:ss") : "—";

interface UseReportColumnsArgs {
  onCheck: (record: EvaluationRecord) => void;
}

export function useReportColumns({
  onCheck,
}: UseReportColumnsArgs): ColumnDef<EvaluationRecord, unknown>[] {
  return useMemo(
    () => [
      createSelectColumn<EvaluationRecord>(),
      {
        accessorKey: "id",
        header: "Record id",
        size: 90,
      },
      {
        id: "sessionStart",
        header: "Session start",
        accessorFn: (row: EvaluationRecord) => row.sessionStart,
        size: 170,
        enableColumnFilter: false,
        cell: ({ getValue }) => formatTimestamp(getValue<string>()),
      },
      {
        id: "sessionEnd",
        header: "Session end",
        accessorFn: (row: EvaluationRecord) => row.sessionEnd ?? "",
        size: 170,
        enableColumnFilter: false,
        cell: ({ row }) => formatTimestamp(row.original.sessionEnd),
      },
      {
        id: "detectedAt",
        header: "Detected at",
        accessorFn: (row: EvaluationRecord) => row.detectedAt,
        size: 170,
        enableColumnFilter: false,
        cell: ({ getValue }) => formatTimestamp(getValue<string>()),
      },
      {
        accessorKey: "testCase",
        header: "Test case",
        size: 220,
      },
      {
        id: "passed",
        header: "Passed",
        accessorFn: (row: EvaluationRecord) => (row.passed ? "True" : "False"),
        size: 90,
      },
      {
        id: "defects",
        header: "Defects",
        accessorFn: (row: EvaluationRecord) => formatDefects(row.defects),
        size: 280,
        enableSorting: false,
        cell: ({ row, getValue }) => {
          const { defects } = row.original;

          if (defects.length === 0) {
            return "—";
          }

          return (
            <Tooltip>
              <TooltipTrigger
                render={<span className="block max-w-[260px] truncate" />}
              >
                {getValue<string>()}
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm">
                <div className="flex flex-col gap-0.5">
                  {defects.map((defect, index) => (
                    <span key={index}>{formatDefect(defect)}</span>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        id: "image",
        header: "Img",
        size: 80,
        enableSorting: false,
        enableColumnFilter: false,
        enableResizing: false,
        cell: ({ row }) => (
          <img
            src={row.original.imageUrl}
            alt="Captured frame"
            className="h-[52px] w-[60px] shrink-0 rounded bg-muted object-cover"
          />
        ),
      },
      {
        id: "check",
        header: "Action",
        size: 90,
        enableSorting: false,
        enableColumnFilter: false,
        enableResizing: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCheck(row.original)}
          >
            Check
          </Button>
        ),
      },
    ],
    [onCheck],
  );
}
