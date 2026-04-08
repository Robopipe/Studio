import { Badge } from "@/modules/shadcn/ui/badge";
import { cn } from "@/lib/utils";
import { Model } from "@repo/schema";
import { Link, useParams } from "react-router";

type BadgeVariant = "default" | "secondary" | "destructive";

export interface ModelCardProps {
  model: Model;
  order: number;
}

export const ModelCard = ({ model, order }: ModelCardProps) => {
  const { projectId, modelId } = useParams();
  const getBadgeVariant = (status: Model["status"]): BadgeVariant => {
    switch (status) {
      case "TRAINING":
        return "secondary";
      case "DRAFT":
        return "secondary";
      case "CONVERTING":
        return "secondary";
      case "ERROR":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <Link
      to={`/projects/${projectId}/models/${model.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        className={cn(
          "rounded-lg border border-black/10 bg-white p-3",
          model.id.toString() === modelId &&
            "border-emerald-700 bg-emerald-50"
        )}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <Badge>v{order}</Badge>
            <Badge variant={getBadgeVariant(model.status)}>
              {model.status.toLowerCase()}
            </Badge>
          </div>
          <p className="text-base font-bold">{model.name}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(model.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </Link>
  );
};
