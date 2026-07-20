import type {
  EventListItem,
  EventSortBy,
} from "@/core/cameraApi/schemas/events";
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
import { formatDefect, formatDefects } from "../../utils/formatDefects";

const formatTimestamp = (value: string | null) =>
  value ? format(new Date(value), "dd.MM.yyyy HH:mm:ss") : "—";

// Column ids the API can sort on; everything else disables sorting.
export const SORT_KEY_BY_COLUMN: Record<string, EventSortBy> = {
  detectedAt: "timestamp",
  sessionStart: "session_start",
  testCase: "test_case_name",
  passed: "passed",
};

interface UseReportColumnsArgs {
  onCheck: (event: EventListItem) => void;
  getPictureUrl: (event: EventListItem) => string;
}

export function useReportColumns({
  onCheck,
  getPictureUrl,
}: UseReportColumnsArgs): ColumnDef<EventListItem, unknown>[] {
  return useMemo(
    () => [
      createSelectColumn<EventListItem>(),
      {
        accessorKey: "id",
        header: "Record id",
        size: 90,
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        id: "detectedAt",
        header: "Detected at",
        accessorFn: (row: EventListItem) => row.timestamp,
        size: 170,
        enableColumnFilter: false,
        cell: ({ getValue }) => formatTimestamp(getValue<string>()),
      },
      {
        id: "testCase",
        header: "Test case",
        accessorFn: (row: EventListItem) => row.test_case_name,
        size: 220,
        enableColumnFilter: false,
      },
      {
        id: "passed",
        header: "Passed",
        accessorFn: (row: EventListItem) => (row.passed ? "True" : "False"),
        size: 90,
        enableColumnFilter: false,
      },
      {
        id: "defects",
        header: "Defects",
        accessorFn: (row: EventListItem) => formatDefects(row.violated_limits),
        size: 280,
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row, getValue }) => {
          const { violated_limits: violatedLimits } = row.original;

          if (violatedLimits.length === 0) {
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
                  {violatedLimits.map((limit, index) => (
                    <span key={index}>{formatDefect(limit)}</span>
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
        cell: ({ row }) =>
          row.original.has_picture ? (
            <img
              src={getPictureUrl(row.original)}
              alt="Captured frame"
              loading="lazy"
              className="h-[52px] w-[60px] shrink-0 rounded bg-muted object-cover"
            />
          ) : (
            "—"
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
    [onCheck, getPictureUrl],
  );
}
