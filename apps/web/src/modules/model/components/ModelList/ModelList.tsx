import { Button } from "@/modules/shadcn/ui/button";
import { ModelStatusEnum } from "@repo/schema";
import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { useGetModelsQuery } from "../../services/modelApi";
import { ModelCard } from "../ModelCard";

export interface ModelListProps {
  className?: string;
}

export const ModelList = ({ className }: ModelListProps) => {
  const { projectId } = useParams();
  const { data: models, refetch } = useGetModelsQuery({
    projectId: Number(projectId),
  });

  const hasActiveModels =
    models?.some(
      (m) =>
        m.status === ModelStatusEnum.TRAINING ||
        m.status === ModelStatusEnum.CONVERTING,
    ) ?? false;

  useEffect(() => {
    if (!hasActiveModels) return;
    const interval = setInterval(() => refetch(), 3000);
    return () => clearInterval(interval);
  }, [hasActiveModels, refetch]);

  return (
    <div
      className={`flex min-h-0 flex-col border-r border-black/10 bg-black/[0.03] py-4 pl-6 pr-2 ${className ?? ""}`}
    >
      <div className="flex flex-shrink-0 flex-col gap-3 pb-3">
        <span className="text-[10px] font-bold uppercase leading-4 tracking-[1px] text-black/90">
          Versions
        </span>
        <Link to={`/projects/${projectId}/models/new`}>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-emerald-700 bg-transparent text-emerald-700 shadow-none hover:bg-emerald-50 hover:text-emerald-700"
          >
            Create new version
          </Button>
        </Link>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {models?.toReversed().map((model, i) => (
          <ModelCard key={model.id} model={model} order={models.length - i} />
        ))}
      </div>
    </div>
  );
};
