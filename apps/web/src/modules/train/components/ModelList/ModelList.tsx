import { Button, Stack, Text } from "@repo/ui";
import { useParams } from "react-router";

export interface ModelListProps {}

export const ModelList = ({}: ModelListProps) => {
  const { projectId } = useParams();

  return (
    <Stack>
      <Text>VERSIONS</Text>
      <Button variant="outlined" size="sm" fullWidth>
        Create new version
      </Button>
      {}
    </Stack>
  );
};
