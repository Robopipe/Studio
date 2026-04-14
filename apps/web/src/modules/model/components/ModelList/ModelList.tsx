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
      className={`overflow-y-auto border-r border-black/10 bg-black/[0.03] p-6 pt-0 ${className ?? ""}`}
    >
      <div className="flex flex-col gap-4">
        <div className="sticky top-0 z-10 flex flex-col gap-4 rounded-b-lg bg-[#f3f3f3] pt-6">
          <span>VERSIONS</span>
          <Link to={`/projects/${projectId}/models/new`}>
            <Button variant="outline" size="sm" className="w-full">
              Create new version
            </Button>
          </Link>
        </div>
        {models?.toReversed().map((model, i) => (
          <ModelCard key={model.id} model={model} order={models.length - i} />
        ))}
      </div>
    </div>
  );
};
