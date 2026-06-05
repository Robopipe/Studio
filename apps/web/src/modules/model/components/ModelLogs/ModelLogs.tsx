import { Button } from "@/modules/shadcn/ui/button";
import type { Label } from "@repo/schema";
import { Download } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useModelParams } from "../../hooks/useModelParams";
import { useGetModelLogsQuery, useGetModelQuery } from "../../services";

export interface ModelLogsProps {}

const formatMetricValue = (value: unknown): string => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toString() : "nan";
  }

  return String(value);
};

const lastSegment = (key: string): string => {
  const parts = key.split("/");
  return parts[parts.length - 1] ?? key;
};

const resolveLabelName = (
  labelId: string,
  labelsById: Map<number, Label>,
): string => {
  const numeric = Number(labelId);
  if (Number.isNaN(numeric)) return labelId;
  return labelsById.get(numeric)?.name ?? `#${labelId}`;
};

export const ModelLogs = ({}: ModelLogsProps) => {
  const { projectId, modelId } = useModelParams();
  const { data: model } = useGetModelQuery({ projectId, modelId });
  const { data: logs } = useGetModelLogsQuery({ projectId, modelId });
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  const labelsById = useMemo(() => {
    const map = new Map<number, Label>();
    for (const label of model?.labels ?? []) {
      map.set(label.id, label);
    }
    return map;
  }, [model?.labels]);

  const downloadLogs = useCallback(() => {
    if (!logs || logs.length === 0) return;

    const aggregateKeys = Array.from(
      new Set(logs.flatMap((log) => Object.keys(log.metrics))),
    );

    // Collect (baseKey, labelId) pairs that actually appear in any log so we
    // don't explode into a cartesian product with empty columns.
    const perClassPairs = new Map<string, Set<string>>();
    for (const log of logs) {
      if (!log.perClassMetrics) continue;
      for (const [baseKey, byLabelId] of Object.entries(log.perClassMetrics)) {
        let labelSet = perClassPairs.get(baseKey);
        if (!labelSet) {
          labelSet = new Set();
          perClassPairs.set(baseKey, labelSet);
        }
        for (const labelId of Object.keys(byLabelId)) labelSet.add(labelId);
      }
    }
    const perClassHeaders: { header: string; base: string; labelId: string }[] =
      [];
    for (const [base, labelSet] of perClassPairs) {
      for (const labelId of labelSet) {
        perClassHeaders.push({
          header: `${lastSegment(base)}[${resolveLabelName(labelId, labelsById)}]`,
          base,
          labelId,
        });
      }
    }

    const header = [
      "epoch",
      "timestamp",
      ...aggregateKeys,
      ...perClassHeaders.map((h) => h.header),
    ].join(",");
    const rows = logs.map((log) =>
      [
        log.epoch,
        log.createdAt,
        ...aggregateKeys.map((key) => log.metrics[key] ?? ""),
        ...perClassHeaders.map(
          ({ base, labelId }) => log.perClassMetrics?.[base]?.[labelId] ?? "",
        ),
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `model-${modelId}-logs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs, modelId, labelsById]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 30;
    isUserScrolledUp.current =
      el.scrollHeight - el.scrollTop - el.clientHeight > threshold;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el && !isUserScrolledUp.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="mb-6 flex min-h-100 flex-1 flex-col overflow-hidden pb-4">
      <div className="flex shrink-0 flex-row items-center justify-between py-2">
        <span className="text-base font-bold">Logs</span>
        {logs && logs.length > 0 && (
          <Button variant="ghost" size="sm" onClick={downloadLogs}>
            <Download className="size-4" />
            Export
          </Button>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#0f0f18] px-4">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-2 [scrollbar-color:rgba(255,255,255,0.15)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb:hover]:bg-white/25 [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
        >
          {logs?.map((log) => (
            <p key={log.id} className="font-mono text-sm text-white/60">
              <span className="text-gray-400">[{log.createdAt}]</span>{" "}
              <span className="text-pear-500">epoch</span>{" "}
              <span className="text-pear-500">{log.epoch}</span>
              <span className="text-gray-400">: </span>
              <span className="text-gray-400">{"{"}</span>
              {Object.entries(log.metrics).map(
                ([key, value], index, entries) => (
                  <span key={key}>
                    <span className="text-blue-200">{key}</span>
                    <span className="text-gray-400">: </span>
                    <span className="text-emerald-400">
                      {formatMetricValue(value)}
                    </span>
                    {index < entries.length - 1 ? (
                      <span className="text-gray-400">, </span>
                    ) : null}
                  </span>
                ),
              )}
              <span className="text-gray-400">{"}"}</span>
            </p>
          ))}
          {model?.errorMessage && (
            <p className="font-mono text-sm text-red-500">
              <span className="text-gray-400">[{model.updatedAt}]</span> Error:{" "}
              {model.errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
