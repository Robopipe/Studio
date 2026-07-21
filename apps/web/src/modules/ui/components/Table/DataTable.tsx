import { PaginationNumbers } from "@/modules/shadcn/ui/pagination";
import { Table } from "@/modules/shadcn/ui/table";
import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { DataTableBody } from "./TableBody";
import { TableProvider } from "./TableContext";
import { DataTableHeader } from "./TableHeader";
import { useDataTable } from "./useDataTable";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  enableRowSelection?: boolean;
  pageSize?: number;
  rowClassName?: (row: T) => string | undefined;
  isLoading?: boolean;
  manualPagination?: boolean;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  rowCount?: number;
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (row: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  enableRowSelection = false,
  pageSize,
  rowClassName,
  isLoading = false,
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
}: DataTableProps<T>) {
  const table = useDataTable({
    data,
    columns,
    enableRowSelection,
    pageSize,
    manualPagination,
    pagination,
    onPaginationChange,
    rowCount,
    manualSorting,
    sorting,
    onSortingChange,
    rowSelection,
    onRowSelectionChange,
    getRowId,
  });

  return (
    <TableProvider table={table}>
      <div className="flex flex-col">
        <div className="rounded-lg border">
          <Table>
            <DataTableHeader />
            <DataTableBody rowClassName={rowClassName} isLoading={isLoading} />
          </Table>
        </div>
        {(pageSize !== undefined || manualPagination) && (
          <PaginationNumbers
            currentPage={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            onPageChange={(page) => table.setPageIndex(page - 1)}
            className="mx-auto py-4"
          />
        )}
      </div>
    </TableProvider>
  );
}
