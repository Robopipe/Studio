import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnSizingState,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";

interface UseDataTableOptions<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  enableRowSelection?: boolean;
  pageSize?: number;
  // Server-side pagination: the data prop holds a single page, rowCount is
  // the server-reported total.
  manualPagination?: boolean;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  rowCount?: number;
  // Server-side sorting: the sorting state maps to API params.
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  // Controlled selection with stable row ids so it survives page changes.
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (row: T) => string;
}

export function useDataTable<T>({
  data,
  columns,
  enableRowSelection = false,
  pageSize,
  manualPagination = false,
  pagination,
  onPaginationChange,
  rowCount,
  manualSorting = false,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  getRowId,
}: UseDataTableOptions<T>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [internalRowSelection, setInternalRowSelection] =
    useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const sortingState = sorting ?? internalSorting;
  const rowSelectionState = rowSelection ?? internalRowSelection;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sortingState,
      columnFilters,
      rowSelection: rowSelectionState,
      columnSizing,
      ...(manualPagination && pagination !== undefined && { pagination }),
    },
    onSortingChange: onSortingChange ?? setInternalSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: onRowSelectionChange ?? setInternalRowSelection,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Only paginate when a page size is set — tables without one keep
    // rendering all rows. In manual mode the server already paged the data,
    // so no pagination row model is applied.
    ...(!manualPagination &&
      pageSize !== undefined && {
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageIndex: 0, pageSize } },
      }),
    ...(manualPagination && {
      manualPagination: true,
      onPaginationChange,
      rowCount,
    }),
    // Header toggles cycle asc → desc → unsorted; in manual mode the unsorted
    // state sends no sort params, i.e. the server's default order.
    ...(manualSorting && { manualSorting: true }),
    ...(getRowId && { getRowId }),
    enableRowSelection,
    columnResizeMode: "onChange",
  });

  return table;
}
