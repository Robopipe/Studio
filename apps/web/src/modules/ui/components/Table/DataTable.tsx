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
}

export function DataTable<T>({
  data,
  columns,
  enableRowSelection = false,
}: DataTableProps<T>) {
  const table = useDataTable({ data, columns, enableRowSelection });

  return (
    <TableProvider table={table}>
      <div className="rounded-lg border">
        <Table>
          <DataTableHeader />
          <DataTableBody />
        </Table>
      </div>
    </TableProvider>
  );
}
