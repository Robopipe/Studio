import type {
  EventListItem,
  EventSortBy,
} from "@/core/cameraApi/schemas/events";
import { Button } from "@/modules/shadcn/ui/button";
import {
  DateTimeRangePanel,
  type DateTimeRange,
} from "@/modules/shadcn/ui/date-time-range-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/modules/shadcn/ui/tooltip";
import { FacetedFilterList } from "@/modules/ui/components/FacetedFilter";
import { createSelectColumn } from "@/modules/ui/components/Table";
import type { EvalTestCase } from "@repo/schema";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useMemo } from "react";
import { formatDefect, formatDefects } from "../../utils/formatDefects";
import type { PassedFilter } from "../ReportsToolbar";

const formatTimestamp = (value: string | null) =>
  value ? format(new Date(value), "dd.MM.yyyy HH:mm:ss") : "—";

// Column ids the API can sort on; everything else disables sorting.
export const SORT_KEY_BY_COLUMN: Record<string, EventSortBy> = {
  detectedAt: "timestamp",
  sessionStart: "session_start",
  testCase: "test_case_name",
  passed: "passed",
};

const PASSED_OPTIONS = [
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
];

export interface ReportColumnFilters {
  range: DateTimeRange;
  onRangeChange: (range: DateTimeRange) => void;
  passed: PassedFilter;
  onPassedChange: (value: PassedFilter) => void;
  testCaseIds: string[];
  onTestCaseIdsChange: (ids: string[]) => void;
  limitIds: string[];
  onLimitIdsChange: (ids: string[]) => void;
  testCases: EvalTestCase[];
}

interface UseReportColumnsArgs {
  onCheck: (event: EventListItem) => void;
  getPictureUrl: (event: EventListItem) => string;
  filters: ReportColumnFilters;
}

export function useReportColumns({
  onCheck,
  getPictureUrl,
  filters,
}: UseReportColumnsArgs): ColumnDef<EventListItem, unknown>[] {
  return useMemo(() => {
    const testCaseGroups = [
      {
        options: filters.testCases.map((testCase) => ({
          value: testCase.id,
          label: testCase.name,
        })),
      },
    ];

    // Defects (limits) are defined per test case, so group them under their
    // owning test case — the same defect name can repeat across test cases.
    const defectGroups = filters.testCases.map((testCase) => ({
      label: testCase.name,
      options: testCase.limits.map((limit) => ({
        value: limit.id,
        label: limit.name,
      })),
    }));

    return [
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
        meta: {
          headerFilter: {
            content: (
              <DateTimeRangePanel
                value={filters.range}
                onChange={filters.onRangeChange}
              />
            ),
            active: Boolean(filters.range.from || filters.range.to),
            contentClassName: "w-auto p-0",
          },
        },
        cell: ({ getValue }) => formatTimestamp(getValue<string>()),
      },
      {
        id: "testCase",
        header: "Test case",
        accessorFn: (row: EventListItem) => row.test_case_name,
        size: 220,
        enableColumnFilter: false,
        meta: {
          headerFilter: {
            content: (
              <FacetedFilterList
                groups={testCaseGroups}
                selected={filters.testCaseIds}
                onChange={filters.onTestCaseIdsChange}
                emptyText="No test cases"
              />
            ),
            active: filters.testCaseIds.length > 0,
          },
        },
      },
      {
        id: "passed",
        header: "Passed",
        accessorFn: (row: EventListItem) => (row.passed ? "True" : "False"),
        size: 90,
        enableColumnFilter: false,
        meta: {
          headerFilter: {
            content: (
              <FacetedFilterList
                multiple={false}
                groups={[{ options: PASSED_OPTIONS }]}
                selected={filters.passed === "all" ? [] : [filters.passed]}
                onChange={(values) =>
                  filters.onPassedChange(
                    (values[0] as PassedFilter | undefined) ?? "all",
                  )
                }
              />
            ),
            active: filters.passed !== "all",
            contentClassName: "w-40",
          },
        },
      },
      {
        id: "defects",
        header: "Defects",
        accessorFn: (row: EventListItem) => formatDefects(row.violated_limits),
        size: 280,
        enableSorting: false,
        enableColumnFilter: false,
        meta: {
          headerFilter: {
            content: (
              <FacetedFilterList
                groups={defectGroups}
                selected={filters.limitIds}
                onChange={filters.onLimitIdsChange}
                emptyText="No defects"
              />
            ),
            active: filters.limitIds.length > 0,
          },
        },
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
    ];
  }, [onCheck, getPictureUrl, filters]);
}
