import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnSizingState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";

interface UseDataTableOptions<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  enableRowSelection?: boolean;
}

export function useDataTable<T>({
  data,
  columns,
  enableRowSelection = false,
}: UseDataTableOptions<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, rowSelection, columnSizing },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection,
    columnResizeMode: "onChange",
  });

  return table;
}
