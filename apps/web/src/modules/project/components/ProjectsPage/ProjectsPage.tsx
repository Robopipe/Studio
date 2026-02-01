import { webRoutes } from "@/config/web/routes";
import { AddSmallIcon, Button, Heading, Stack } from "@repo/ui";
import { useNavigate } from "react-router";
import { useGetProjectsQuery } from "../../services/projectApi";
import { ProjectCard } from "../ProjectCard";

export interface ProjectsPageProps {}

export const ProjectsPage = ({}: ProjectsPageProps) => {
  const { data: projects } = useGetProjectsQuery();
  const navigate = useNavigate();

  return (
    <Stack fullWidth gap="md">
      <Stack fullWidth gap="sm" direction="row" justify="space-between">
        <Heading variant="h5" weight="600">
          Projects
        </Heading>
        <Button iconStart={<AddSmallIcon />}>New project</Button>
      </Stack>
      {projects?.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onClick={() => {
            navigate(
              webRoutes.main.project.replace(":id", project.id.toString()),
            );
          }}
        />
      ))}
    </Stack>
  );
};
