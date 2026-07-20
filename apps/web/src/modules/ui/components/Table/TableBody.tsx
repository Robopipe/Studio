import { cn } from "@/lib/utils";
import { TableBody, TableCell, TableRow } from "@/modules/shadcn/ui/table";
import { flexRender } from "@tanstack/react-table";
import { Loader2Icon } from "lucide-react";
import { useTableContext } from "./TableContext";

interface DataTableBodyProps<T> {
  rowClassName?: (row: T) => string | undefined;
  isLoading?: boolean;
}

export function DataTableBody<T>({
  rowClassName,
  isLoading = false,
}: DataTableBodyProps<T>) {
  const table = useTableContext<T>();
  const rows = table.getRowModel().rows;
  const columnCount = table.getAllColumns().length;

  if (rows.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell
            colSpan={columnCount}
            className="h-24 text-center text-muted-foreground"
          >
            {isLoading ? (
              <Loader2Icon className="mx-auto size-5 animate-spin" />
            ) : (
              "No data available"
            )}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {rows.map((row) => (
        <TableRow
          key={row.id}
          data-state={row.getIsSelected() && "selected"}
          className={cn(rowClassName?.(row.original))}
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
