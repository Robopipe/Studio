import { Checkbox } from "@/modules/shadcn/ui/checkbox";
import { type ColumnDef } from "@tanstack/react-table";
import { type ReactNode } from "react";

export function createSelectColumn<T>(): ColumnDef<T, unknown> {
  return {
    id: "select",
    size: 40,
    enableSorting: false,
    enableColumnFilter: false,
    enableResizing: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  };
}

interface Action<T> {
  icon: ReactNode;
  onClick: (row: T) => void;
  label?: string;
}

export function createActionsColumn<T>(
  actions: Action<T>[],
): ColumnDef<T, unknown> {
  return {
    id: "actions",
    header: "Action",
    enableSorting: false,
    enableColumnFilter: false,
    enableResizing: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        {actions.map((action, i) => (
          <button
            key={i}
            type="button"
            onClick={() => action.onClick(row.original)}
            className="cursor-pointer rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted"
            aria-label={action.label}
          >
            {action.icon}
          </button>
        ))}
      </div>
    ),
  };
}
