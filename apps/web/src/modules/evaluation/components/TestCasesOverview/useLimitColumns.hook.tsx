import {
  createActionsColumn,
  createSelectColumn,
} from "@/modules/ui/components/Table";
import { Badge } from "@/modules/shadcn/ui/badge";
import { EvalLimit } from "@repo/schema";
import { type ColumnDef } from "@tanstack/react-table";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useMemo } from "react";

export function useLimitColumns(
  onEdit: (limit: EvalLimit) => void,
  onDelete: (limit: EvalLimit) => void,
): ColumnDef<EvalLimit, unknown>[] {
  return useMemo(
    () => [
      createSelectColumn<EvalLimit>(),
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ getValue }) => getValue() ?? "—",
      },
      {
        accessorKey: "enabled",
        header: "Status",
        cell: ({ getValue }) =>
          getValue() ? (
            <Badge>Enabled</Badge>
          ) : (
            <Badge variant="secondary">Disabled</Badge>
          ),
      },
      {
        id: "targetLabel",
        header: "Label",
        accessorFn: (row: EvalLimit) => row.targetLabel.name,
      },
      {
        id: "parentLabel",
        header: "Parent",
        accessorFn: (row: EvalLimit) =>
          row.targetParentLabel?.name ?? "—",
      },
      createActionsColumn<EvalLimit>([
        {
          icon: <PencilIcon className="size-4" />,
          onClick: onEdit,
          label: "Edit limit",
        },
        {
          icon: <Trash2Icon className="size-4 text-destructive" />,
          onClick: onDelete,
          label: "Delete limit",
        },
      ]),
    ],
    [onEdit, onDelete],
  );
}
