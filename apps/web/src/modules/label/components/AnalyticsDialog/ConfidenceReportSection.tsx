import { useAuth } from "@/core/auth/hooks";
import { cn } from "@/lib/utils";
import {
  isReportActive,
  useCancelConfidenceReportMutation,
  useConfidenceReport,
  useRunConfidenceReportMutation,
} from "@/modules/analytics/services/confidenceReportApi";
import { useGetModelsQuery } from "@/modules/model/services/modelApi";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { Button } from "@/modules/shadcn/ui/button";
import { NumberInput } from "@/modules/shadcn/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/shadcn/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/modules/shadcn/ui/tabs";
import {
  ConfidenceReportGtGeometryEnum,
  ConfidenceReportStatusEnum,
  Model,
  ModelBackendEnum,
  ModelOutputTypeEnum,
  ModelStatusEnum,
  OrgMemberRoleEnum,
  ProjectTypeEnum,
} from "@repo/schema";
import { AlertCircle, Loader2, Play, Square } from "lucide-react";
import { useState } from "react";

import { metricColor } from "@/modules/analytics/utils/metricColor";
import { ConfidenceBoxPlot } from "./ConfidenceBoxPlot";
import { EmptyState } from "./EmptyState";

/** Models eligible for confidence report: DONE, ULTRALYTICS, has RAW output, not classification. */
function isEligibleModel(model: Model): boolean {
  return (
    model.status === ModelStatusEnum.DONE &&
    model.backend === ModelBackendEnum.ULTRALYTICS &&
    model.outputs.some((o) => o.type === ModelOutputTypeEnum.RAW) &&
    model.trainingType !== ProjectTypeEnum.CLASSIFICATION
  );
}

export const ConfidenceReportSection = () => {
  const [activeProject] = useActiveProject();
  const projectId = activeProject?.id;

  const { role } = useAuth();
  const canManage =
    role === OrgMemberRoleEnum.ADMIN || role === OrgMemberRoleEnum.OWNER;

  // ── data ──────────────────────────────────────────────────────────────────
  const { data: models = [] } = useGetModelsQuery(
    { projectId: projectId! },
    { skip: !projectId || !canManage },
  );

  const eligibleModels = models
    .filter(isEligibleModel)
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));

  const { data: report } = useConfidenceReport(projectId);

  const [runReport, { isLoading: isRunning }] =
    useRunConfidenceReportMutation();
  const [cancelReport, { isLoading: isCancelling }] =
    useCancelConfidenceReportMutation();

  // ── local state ────────────────────────────────────────────────────────────
  const defaultModelId = eligibleModels[0]?.id;
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [conf, setConf] = useState<number | null>(0.25);
  const [matchIou, setMatchIou] = useState<number | null>(0.5);
  const [gtGeometry, setGtGeometry] = useState<ConfidenceReportGtGeometryEnum>(
    ConfidenceReportGtGeometryEnum.RECTANGLE,
  );

  const effectiveModelId = selectedModelId ?? defaultModelId ?? null;
  const selectedModel = models.find((m) => m.id === effectiveModelId);
  const isDetection = selectedModel?.trainingType === ProjectTypeEnum.DETECTION;

  const active = isReportActive(report);

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (
      !projectId ||
      effectiveModelId == null ||
      conf == null ||
      matchIou == null
    )
      return;
    try {
      await runReport({
        projectId,
        modelId: effectiveModelId,
        conf,
        matchIou,
        gtGeometry: isDetection
          ? gtGeometry
          : ConfidenceReportGtGeometryEnum.POLYGON,
      }).unwrap();
    } catch {
      // error surfaced via report.status === ERROR
    }
  };

  const handleCancel = async () => {
    if (!projectId) return;
    try {
      await cancelReport({ projectId }).unwrap();
    } catch {
      // ignore
    }
  };

  if (!projectId) return null;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 border-t border-black/10 pt-4">
      <p className="text-sm font-semibold text-foreground">Confidence Report</p>

      {/* Controls row — running reports is restricted to admins and owners */}
      {canManage && (
        <div className="flex flex-wrap items-end gap-3">
          {/* Model selector */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Model</span>
            <Select
              value={effectiveModelId != null ? String(effectiveModelId) : ""}
              onValueChange={(v) => {
                if (v !== null) setSelectedModelId(Number(v));
              }}
              disabled={active || eligibleModels.length === 0}
            >
              <SelectTrigger size="sm" className="w-48">
                <SelectValue
                  placeholder={
                    eligibleModels.length === 0
                      ? "No eligible models"
                      : "Select model"
                  }
                >
                  {selectedModel?.name ?? eligibleModels[0]?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {eligibleModels.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Confidence threshold */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <NumberInput
              value={conf}
              onValueChange={(v) => setConf(v == null ? null : Math.min(1, v))}
              decimal
              min={0}
              max={1}
              step={0.01}
              className="h-9 w-24 text-sm"
              disabled={active}
            />
          </div>

          {/* IoU matching threshold — a prediction counts as a TP at IoU ≥ this */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">IoU</span>
            <NumberInput
              value={matchIou}
              onValueChange={(v) =>
                setMatchIou(v == null ? null : Math.min(1, v))
              }
              decimal
              min={0}
              max={1}
              step={0.01}
              className="h-9 w-24 text-sm"
              disabled={active}
            />
          </div>

          {/* GT geometry toggle — detection models only */}
          {isDetection && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Ground truth
              </span>
              <div className="flex gap-1">
                {(
                  [
                    [ConfidenceReportGtGeometryEnum.RECTANGLE, "Boxes"],
                    [ConfidenceReportGtGeometryEnum.POLYGON, "Polygons"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    disabled={active}
                    onClick={() => setGtGeometry(value)}
                    className={cn(
                      "h-9 cursor-pointer rounded-md border px-3 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50",
                      gtGeometry === value
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-black/10 bg-transparent text-muted-foreground hover:bg-black/4",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Run / Cancel button — label spacer keeps it bottom-aligned with labelled inputs */}
          <div className="ml-auto flex flex-col gap-1">
            <span className="invisible text-xs">_</span>
            <div className="flex items-center gap-2">
              {active && report && (
                <span className="text-xs text-muted-foreground">
                  {report.processed} / {report.total} images
                </span>
              )}
              {active ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Square className="mr-1.5 size-3.5" />
                  )}
                  Cancel
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleRun}
                  disabled={
                    isRunning ||
                    eligibleModels.length === 0 ||
                    conf == null ||
                    matchIou == null
                  }
                >
                  {isRunning ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Play className="mr-1.5 size-3.5" />
                  )}
                  Run
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results area */}
      <ReportResults report={report} active={active} canManage={canManage} />
    </div>
  );
};

// ─── Results sub-component ────────────────────────────────────────────────────

type Report = NonNullable<ReturnType<typeof useConfidenceReport>["data"]>;

const ReportResults = ({
  report,
  active,
  canManage,
}: {
  report: Report | undefined;
  active: boolean;
  canManage: boolean;
}) => {
  if (!report) {
    return (
      <EmptyState
        message={
          canManage
            ? "Run a confidence analysis to see results here."
            : "No confidence report yet. An admin can run one from this dialog."
        }
      />
    );
  }

  if (report.status === ConfidenceReportStatusEnum.PENDING || active) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-black/10 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin opacity-50" />
        <span>
          {report.status === ConfidenceReportStatusEnum.PENDING
            ? "Starting…"
            : `Processing ${report.processed} / ${report.total} images…`}
        </span>
      </div>
    );
  }

  if (report.status === ConfidenceReportStatusEnum.ERROR) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        <AlertCircle className="size-4 shrink-0" />
        <span>{report.errorMessage ?? "An unknown error occurred."}</span>
      </div>
    );
  }

  if (report.status === ConfidenceReportStatusEnum.CANCELLED) {
    return (
      <EmptyState
        message={
          canManage
            ? "Analysis was cancelled. Run again to see results."
            : "Analysis was cancelled."
        }
      />
    );
  }

  if (!report.perClassStats || report.perClassStats.length === 0) {
    return (
      <EmptyState message="No per-class statistics available. Ensure the model has detections above the chosen threshold." />
    );
  }

  const caption = [
    report.modelName && `Model: ${report.modelName}`,
    `Threshold: ${(report.conf * 100).toFixed(0)}%`,
    `IoU: ≥ ${report.matchIou}`,
    `Ran: ${new Date(report.createdAt).toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const fmtPct = (v: number | null | undefined) =>
    v == null ? "—" : `${(v * 100).toFixed(0)}%`;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      <p className="text-xs text-muted-foreground">
        Precision{" "}
        <span
          className={cn(
            report.overallPrecision != null
              ? metricColor(report.overallPrecision)
              : "text-muted-foreground",
          )}
        >
          {fmtPct(report.overallPrecision)}
        </span>
        {" · "}
        Recall{" "}
        <span
          className={cn(
            report.overallRecall != null
              ? metricColor(report.overallRecall)
              : "text-muted-foreground",
          )}
        >
          {fmtPct(report.overallRecall)}
        </span>
      </p>

      <Tabs defaultValue="confidence">
        <TabsList variant="line" className="shrink-0">
          <TabsTrigger value="confidence">Confidence</TabsTrigger>
          <TabsTrigger value="iou">IoU</TabsTrigger>
        </TabsList>

        <TabsContent value="confidence" className="pt-4">
          <p className="mb-3 text-xs text-muted-foreground">
            Confidence score distribution per class — box: Q1–Q3, line: median,
            whiskers: 1.5 × IQR
          </p>
          <ConfidenceBoxPlot
            stats={report.perClassStats}
            metric="confidence"
            yAxisLabel="Confidence"
          />
        </TabsContent>

        <TabsContent value="iou" className="pt-4">
          <p className="mb-3 text-xs text-muted-foreground">
            IoU distribution for matched true-positives (IoU ≥{" "}
            {report.matchIou}) per class
          </p>
          <ConfidenceBoxPlot
            stats={report.perClassStats}
            metric="iou"
            yAxisLabel="IoU"
            matchIou={report.matchIou}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
