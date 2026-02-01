import { Button, Container, Stack, Text } from "@repo/ui";
import styles from "./ModelList.module.scss";

export interface ModelListProps {
  className?: string;
}

export const ModelList = ({ className }: ModelListProps) => {
  // const { projectId } = useParams();

  return (
    <Container size="full" className={`${styles.modelList} ${className}`}>
      <Stack>
        <Text>VERSIONS</Text>
        <Button variant="outlined" size="sm" fullWidth>
          Create new version
        </Button>
        {}
      </Stack>
    </Container>
  );
};
