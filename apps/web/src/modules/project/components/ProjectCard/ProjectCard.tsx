import { Project } from "@repo/schema";
import { Settings, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDeleteProjectMutation } from "../../services/projectApi";
import { EditProjectModal } from "../EditProjectModal";

export interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteProject] = useDeleteProjectMutation();

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(project.createdAt));

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        await deleteProject({ projectId: project.id }).unwrap();
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  return (
    <>
      <div
        className="flex w-[21rem] cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
        onClick={onClick}
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-row items-center justify-between">
            <span className="text-base">{project.name}</span>
            <div className="flex flex-row gap-2">
              <Settings
                className="size-5 cursor-pointer text-gray-800 hover:text-gray-600"
                onClick={handleEdit}
              />
              <Trash2
                className="size-5 cursor-pointer text-red-800 hover:text-red-600"
                onClick={handleDelete}
              />
            </div>
          </div>

          <div className="flex flex-row items-center">
            <span className="text-sm">{project.annotatedTaskCount}/{project.taskCount}</span>
          </div>
        </div>
        <div className="h-px w-full bg-gray-300" />

        <div className="flex items-center justify-between px-5 py-3">
          <span className="text-xs text-gray-950">{formattedDate}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-xs font-semibold text-[#495057]">
            AD
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <EditProjectModal
          project={project}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
};
