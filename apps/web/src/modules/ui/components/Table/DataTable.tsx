import { PaginationNumbers } from "@/modules/shadcn/ui/pagination";
import { Table } from "@/modules/shadcn/ui/table";
import { type ColumnDef } from "@tanstack/react-table";
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
}

export function DataTable<T>({
  data,
  columns,
  enableRowSelection = false,
  pageSize,
  rowClassName,
}: DataTableProps<T>) {
  const table = useDataTable({ data, columns, enableRowSelection, pageSize });

  return (
    <TableProvider table={table}>
      <div className="flex flex-col">
        <div className="rounded-lg border">
          <Table>
            <DataTableHeader />
            <DataTableBody rowClassName={rowClassName} />
          </Table>
        </div>
        {pageSize !== undefined && (
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
