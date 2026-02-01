import { webRoutes } from "@/config/web/routes";
import { AddSmallIcon, Button, Heading, Stack } from "@repo/ui";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useGetProjectsQuery } from "../../services/projectApi";
import { CreateProjectModal } from "../CreateProjectModal";
import { ProjectCard } from "../ProjectCard";

import styles from "./ProjectsPage.module.scss";

export interface ProjectsPageProps {}

export const ProjectsPage = ({}: ProjectsPageProps) => {
  const { data: projects } = useGetProjectsQuery();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Stack fullWidth gap="md">
      <Stack
        fullWidth
        gap="sm"
        direction="row"
        justify="space-between"
        align="center"
      >
        <Heading variant="h5" weight="600">
          Projects
        </Heading>
        <Button
          iconStart={<AddSmallIcon />}
          onClick={() => setIsModalOpen(true)}
          size="md"
        >
          New project
        </Button>
      </Stack>
      <div className={styles.projectsGrid}>
        {projects?.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => {
              navigate(
                webRoutes.main.project.replace(":projectId", project.id.toString()),
              );
            }}
          />
        ))}
      </div>

      {isModalOpen && (
        <CreateProjectModal onClose={() => setIsModalOpen(false)} />
      )}
    </Stack>
  );
};
