import { webRoutes } from "@/config/web/routes";
import { AddSmallIcon, Button, Heading, Stack } from "@repo/ui";
import { useNavigate } from "react-router";
import { useActiveProject } from "../../hooks/useActiveProject";
import { useGetProjectsQuery } from "../../services/projectApi";
import { ProjectCard } from "../ProjectCard";

export interface ProjectsPageProps {}

export const ProjectsPage = ({}: ProjectsPageProps) => {
  const { data: projects } = useGetProjectsQuery();
  const [activeProject, setActiveProject] = useActiveProject();
  const navigate = useNavigate();

  return (
    <Stack fullWidth gap="md">
      <Stack fullWidth gap="sm" direction="row" justify="space-between">
        <Heading variant="h5" weight="600">
          Projects
        </Heading>
        <Button iconStart={<AddSmallIcon />}>New project</Button>
      </Stack>
      Active project: {activeProject?.name}
      {projects?.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={() => {
            setActiveProject(project);
            navigate(
              webRoutes.main.project.replace(":id", project.id.toString()),
            );
          }}
        />
      ))}
    </Stack>
  );
};
