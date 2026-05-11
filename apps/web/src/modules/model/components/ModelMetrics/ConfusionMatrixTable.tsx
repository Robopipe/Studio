import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/modules/shadcn/ui/table";
import type { Label } from "@repo/schema";
import { useMemo } from "react";
import { resolveLabelName } from "./utils";

export interface ConfusionMatrixTableProps {
  matrixKey: string;
  labels: (string | null)[];
  matrix: number[][];
  labelsById: Map<number, Label>;
}

export const ConfusionMatrixTable = ({
  labels,
  matrix,
  labelsById,
}: ConfusionMatrixTableProps) => {
  const maxCell = useMemo(() => {
    let m = 0;
    for (const row of matrix) for (const v of row) if (v > m) m = v;
    return m;
  }, [matrix]);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="overflow-x-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Ground Truth / Prediction</TableHead>
              {labels.map((labelId, idx) => (
                <TableHead
                  key={`${labelId ?? "no-match"}-${idx}`}
                  className="text-right"
                >
                  {resolveLabelName(labelId, labelsById)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrix.map((row, rowIdx) => {
              const rowLabelId = labels[rowIdx] ?? null;
              return (
                <TableRow key={`${rowLabelId ?? "no-match"}-${rowIdx}`}>
                  <TableCell className="font-medium">
                    {resolveLabelName(rowLabelId, labelsById)}
                  </TableCell>
                  {row.map((cell, colIdx) => {
                    const ratio = maxCell > 0 ? cell / maxCell : 0;
                    const alpha = Math.min(0.1 + ratio * 0.5, 0.6);
                    const style =
                      cell > 0
                        ? {
                            backgroundColor: `rgba(${
                              colIdx === rowIdx ? "16, 185, 129" : "239, 68, 68"
                            }, ${alpha})`,
                          }
                        : undefined;
                    return (
                      <TableCell
                        key={colIdx}
                        style={style}
                        className="text-right tabular-nums"
                      >
                        {cell}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
