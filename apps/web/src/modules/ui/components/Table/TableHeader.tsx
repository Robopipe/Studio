import { TableHead, TableHeader, TableRow } from "@/modules/shadcn/ui/table";
import { flexRender } from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { ColumnFilter } from "./ColumnFilter";
import { useTableContext } from "./TableContext";

function SortIndicator({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc")
    return <ChevronUpIcon className="size-4 text-primary" />;
  if (direction === "desc")
    return <ChevronDownIcon className="size-4 text-primary" />;
  return <ChevronsUpDownIcon className="size-4 text-gray-500" />;
}

export function DataTableHeader() {
  const table = useTableContext();

  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const canSort = header.column.getCanSort();
            const canFilter = header.column.getCanFilter();

            return (
              <TableHead
                key={header.id}
                className="relative"
                style={{ width: header.getSize() }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`select-none truncate ${canSort ? "cursor-pointer" : ""}`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </span>

                  {(canFilter || canSort) && (
                    <div className="flex shrink-0 items-center gap-1">
                      {canFilter && <ColumnFilter column={header.column} />}
                      {canSort && (
                        <button
                          type="button"
                          className="cursor-pointer text-muted-foreground opacity-60 hover:opacity-100"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <SortIndicator
                            direction={header.column.getIsSorted()}
                          />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {header.column.getCanResize() && (
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className="absolute top-0 right-0 h-full w-1 cursor-col-resize select-none touch-none opacity-0 hover:bg-primary hover:opacity-100"
                  />
                )}
              </TableHead>
            );
          })}
        </TableRow>
      ))}
    </TableHeader>
  );
}
