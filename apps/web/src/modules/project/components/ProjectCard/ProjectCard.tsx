import { Project } from "@repo/schema";
import {
  BulbIcon,
  CheckIcon,
  DeleteIcon,
  MinusIcon,
  SettingsIcon,
  Stack,
  Text,
} from "@repo/ui";
import styles from "./ProjectCard.module.scss";

export interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export const ProjectCard = ({ project, onClick }: ProjectCardProps) => {
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(project.createdAt));

  return (
    <div className={styles.projectCard} onClick={onClick}>
      <div className={styles.projectContent}>
        <Stack direction="row" align="center" justify="space-between">
          <Text variant="text-16" weight="600">
            {project.name}
          </Text>
          <Stack direction="row" gap={8}>
            <SettingsIcon className={styles.editIcon} />
            <DeleteIcon className={styles.deleteIcon} />
          </Stack>
        </Stack>

        <Stack direction="row" align="center" justify="space-between">
          <Text variant="text-14">0/0</Text>

          <Stack direction="row" align="center" gap={16}>
            <div className={styles.statItem}>
              <CheckIcon className={styles.captureIcon} />
              <Text variant="text-14">0</Text>
            </div>
            <div className={styles.statItem}>
              <MinusIcon className={styles.labelIcon} />
              <Text variant="text-14">0</Text>
            </div>
            <div className={styles.statItem}>
              <BulbIcon className={styles.trainIcon} />
              <Text variant="text-14">0</Text>
            </div>
          </Stack>
        </Stack>
      </div>
      <div className={styles.divider} />

      <div className={styles.projectFooter}>
        <Text variant="text-12" color="gray-950">
          {formattedDate}
        </Text>
        <div className={styles.avatar}>AD</div>
      </div>
    </div>
  );
};
