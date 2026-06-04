import { webRoutes } from "@/config/web/routes";
import { Button } from "@/modules/shadcn/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useGetProjectsQuery } from "../../services/projectApi";
import { CreateProjectModal } from "../CreateProjectModal";
import { ProjectCard, ProjectCardSkeleton } from "../ProjectCard";
import { EmptyProjectsState } from "./EmptyProjectsState";

export interface ProjectsPageProps {}

export const ProjectsPage = ({}: ProjectsPageProps) => {
  const { data: projects, isLoading } = useGetProjectsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex w-full flex-1 flex-col gap-4">
      <div className="flex w-full flex-row items-center justify-between gap-2">
        <h5 className="text-xl font-semibold">Projects</h5>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus />
          New project
        </Button>
      </div>
      {isLoading ? (
        <div className="flex w-full flex-wrap gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <EmptyProjectsState onCreate={() => setIsModalOpen(true)} />
      ) : (
        <div className="flex w-full flex-wrap gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => {
                navigate(
                  webRoutes.capture.replace(
                    ":projectId",
                    project.id.toString(),
                  ),
                );
              }}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <CreateProjectModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};
