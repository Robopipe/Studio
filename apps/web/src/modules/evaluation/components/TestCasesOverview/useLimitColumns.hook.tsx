import {
  createActionsColumn,
  createSelectColumn,
} from "@/modules/ui/components/Table";
import { EvalLimitDetail } from "@repo/schema";
import { type ColumnDef } from "@tanstack/react-table";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useMemo } from "react";
import { formatLimitValue, parameterLabel } from "../../utils/limitFormatters";

export function useLimitColumns(
  onEdit: (limit: EvalLimitDetail) => void,
  onDelete: (limit: EvalLimitDetail) => void,
): ColumnDef<EvalLimitDetail, unknown>[] {
  return useMemo(
    () => [
      createSelectColumn<EvalLimitDetail>(),
      {
        accessorKey: "name",
        header: "Name",
        size: 212,
      },
      {
        id: "targetLabel",
        header: "Label",
        accessorFn: (row: EvalLimitDetail) => row.targetLabel.name,
        size: 96,
      },
      {
        id: "parentLabel",
        header: "Parent",
        accessorFn: (row: EvalLimitDetail) =>
          row.targetParentLabel?.name ?? "—",
        size: 96,
      },
      {
        id: "parameter",
        header: "Parameter",
        accessorFn: (row: EvalLimitDetail) => {
          const params = row.limitItems.map(
            (li) => parameterLabel[li.parameter] ?? li.parameter,
          );
          return [...new Set(params)].join(", ");
        },
        size: 102,
      },
      {
        id: "limitFrom",
        header: "Limit From",
        cell: ({ row }) =>
          row.original.limitItems
            .map((li) => formatLimitValue(li.limitFrom, li.parameter))
            .join(" | "),
        size: 320,
        enableSorting: false,
      },
      {
        id: "limitTo",
        header: "Limit To",
        cell: ({ row }) =>
          row.original.limitItems
            .map((li) => formatLimitValue(li.limitTo, li.parameter))
            .join(" | "),
        size: 320,
        enableSorting: false,
      },
      createActionsColumn<EvalLimitDetail>([
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
