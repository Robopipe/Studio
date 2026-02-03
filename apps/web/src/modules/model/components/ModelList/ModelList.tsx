import { Button, Container, Stack, Text } from "@repo/ui";
import { Link, useParams } from "react-router";
import { useGetModelsQuery } from "../../services/modelApi";
import { ModelCard } from "../ModelCard";
import styles from "./ModelList.module.scss";

export interface ModelListProps {
  className?: string;
}

export const ModelList = ({ className }: ModelListProps) => {
  const { projectId } = useParams();
  const { data: models } = useGetModelsQuery({ projectId: Number(projectId) });

  return (
    <Container size="full" className={`${styles.modelList} ${className}`}>
      <Stack>
        <Stack className={styles.header}>
          <Text>VERSIONS</Text>
          <Link to={`/projects/${projectId}/models/new`}>
            <Button variant="outlined" size="sm" fullWidth>
              Create new version
            </Button>
          </Link>
        </Stack>
        {models?.toReversed().map((model, i) => (
          <ModelCard key={model.id} model={model} order={models.length - i} />
        ))}
      </Stack>
    </Container>
  );
};
