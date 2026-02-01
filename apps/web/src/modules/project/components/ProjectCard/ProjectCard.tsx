import { Project } from "@repo/schema";
import { DeleteIcon, Heading, SettingsIcon } from "@repo/ui";
import styles from "./ProjectCard.module.scss";

export interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  return (
    <div className={styles.projectCard} onClick={onClick}>
      <Heading variant="h5" weight="600">
        {project.name}
      </Heading>

      <SettingsIcon />
      <DeleteIcon />
    </div>
  );
};
