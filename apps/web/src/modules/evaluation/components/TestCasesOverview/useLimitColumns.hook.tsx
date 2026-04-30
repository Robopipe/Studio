import {
  createActionsColumn,
  createSelectColumn,
} from "@/modules/ui/components/Table";
import { EvalLimit } from "@repo/schema";
import { type ColumnDef } from "@tanstack/react-table";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useMemo } from "react";
import { LimitEnabledSwitch } from "./LimitEnabledSwitch";

interface UseLimitColumnsArgs {
  projectId: number;
  configId: number;
  testCaseId: string;
  onEdit: (limit: EvalLimit) => void;
  onDelete: (limit: EvalLimit) => void;
}

export function useLimitColumns({
  projectId,
  configId,
  testCaseId,
  onEdit,
  onDelete,
}: UseLimitColumnsArgs): ColumnDef<EvalLimit, unknown>[] {
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
        cell: ({ row }) => (
          <LimitEnabledSwitch
            limit={row.original}
            projectId={projectId}
            configId={configId}
            testCaseId={testCaseId}
          />
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
    [projectId, configId, testCaseId, onEdit, onDelete],
  );
}
