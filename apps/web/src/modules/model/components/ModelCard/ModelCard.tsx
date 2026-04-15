import { Badge } from "@/modules/shadcn/ui/badge";
import { cn } from "@/lib/utils";
import { Model, ModelStatusEnum } from "@repo/schema";
import { Link, useParams } from "react-router";

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
};

export const ModelCard = ({ model, order }: ModelCardProps) => {
  const { projectId, modelId } = useParams();
  const status = STATUS_STYLES[model.status];
  const isSelected = model.id.toString() === modelId;

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
      </div>
    </Link>
  );
};
