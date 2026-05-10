import { Badge } from "@/modules/shadcn/ui/badge";
import { cn } from "@/lib/utils";
import { Model, ModelStatusEnum } from "@repo/schema";
import { Link, useParams } from "react-router";
import { TRAINING_TYPE_LABELS } from "../../constants/labels";
import { useGetModelLogsQuery } from "../../services";
import { bestHeadline, getHeadlineLabel } from "../../utils/headlineMetric";

const formatMetric = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(3);
};

export interface ModelCardProps {
  model: Model;
  order: number;
}

const STATUS_STYLES: Record<
  ModelStatusEnum,
  { label: string; className: string }
> = {
  [ModelStatusEnum.DONE]: {
    label: "Trained",
    className: "bg-emerald-100 text-emerald-700",
  },
  [ModelStatusEnum.TRAINING]: {
    label: "Training",
    className: "bg-pear-100 text-emerald-700",
  },
  [ModelStatusEnum.CONVERTING]: {
    label: "Converting",
    className: "bg-pear-100 text-emerald-700",
  },
  [ModelStatusEnum.DRAFT]: {
    label: "Draft",
    className: "bg-black/5 text-black/60",
  },
  [ModelStatusEnum.ERROR]: {
    label: "Error",
    className: "bg-red-100 text-red-600",
  },
  [ModelStatusEnum.CANCELLED]: {
    label: "Error",
    className: "bg-red-100 text-red-600",
  },
};

export const ModelCard = ({ model, order }: ModelCardProps) => {
  const { projectId, modelId } = useParams();
  const status = STATUS_STYLES[model.status];
  const isSelected = model.id.toString() === modelId;

  // Pull per-epoch logs so we can show the best mAP@50 (or canonical accuracy
  // for classification) — `model.finalAccuracy` is mAP50-95, the wrong metric.
  const { data: logs } = useGetModelLogsQuery(
    { projectId: Number(projectId), modelId: model.id },
    { skip: model.status !== ModelStatusEnum.DONE },
  );
  const headlineValue = bestHeadline(logs, model.trainingType);
  const headlineLabel = getHeadlineLabel(model.trainingType);

  return (
    <Link
      to={`/projects/${projectId}/models/${model.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        className={cn(
          "flex cursor-pointer flex-col gap-2 rounded-lg border border-black/10 bg-white p-3 transition-colors hover:border-black/20 hover:bg-black/[0.02]",
          isSelected &&
            "border-emerald-700 bg-emerald-50 hover:border-emerald-700 hover:bg-emerald-50",
        )}
      >
        <div className="flex items-center gap-1">
          <Badge className="h-auto min-w-6 rounded-full bg-black/5 px-1.5 py-0.5 text-[11px] font-normal text-black/60">
            v{order}
          </Badge>
          <Badge
            className={cn(
              "h-auto rounded-full px-1.5 py-0.5 text-[11px] font-normal",
              status.className,
            )}
          >
            {status.label}
          </Badge>
        </div>
        <p className="text-base font-bold leading-6 text-black/90">
          {model.name}
        </p>
        <p className="text-xs leading-4 text-black/60">
          {new Date(model.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {model.status === ModelStatusEnum.DONE && (
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-black/5 pt-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase leading-3 tracking-[0.5px] text-black/50">
                Type
              </span>
              <span className="text-xs font-semibold leading-4 text-black/90">
                {TRAINING_TYPE_LABELS[model.trainingType]}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase leading-3 tracking-[0.5px] text-black/50">
                Epochs
              </span>
              <span className="text-xs font-semibold leading-4 text-black/90">
                {model.epochs}
              </span>
            </div>
            {(headlineValue != null || model.finalLoss != null) && (
              <>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase leading-3 tracking-[0.5px] text-black/50">
                    {headlineLabel}
                  </span>
                  <span className="text-xs font-semibold leading-4 text-emerald-700">
                    {formatMetric(headlineValue)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase leading-3 tracking-[0.5px] text-black/50">
                    Loss
                  </span>
                  <span className="text-xs font-semibold leading-4 text-black/90">
                    {formatMetric(model.finalLoss)}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};
