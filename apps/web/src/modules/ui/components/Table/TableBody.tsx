import { TableBody, TableCell, TableRow } from "@/modules/shadcn/ui/table";
import { flexRender } from "@tanstack/react-table";
import { useTableContext } from "./TableContext";

export function DataTableBody() {
  const table = useTableContext();
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
            No data available
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
