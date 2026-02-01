import { Heading, Spinner, Stack, Text } from "@repo/ui";
import { useParams } from "react-router";
import z from "zod";
import { useGetProjectQuery } from "../../services/projectApi";

export interface ProjectPageProps {}

export const ProjectPage = ({}: ProjectPageProps) => {
  const { id } = useParams();
  const projectId = z.coerce.number().parse(id);
  const { data: project, isLoading } = useGetProjectQuery({ projectId });

  if (isLoading) {
    return <Spinner />;
  }
  if (!project) {
    throw new Error("Project not found");
  }

  return (
    <Stack fullWidth gap="md">
      <Heading variant="h5" weight="600">
        {project.name}
      </Heading>

      <Text variant="text-16" weight="600">
        Add Label Names
      </Text>

      <Text variant="text-14" weight="500">
        Use new line as a separator to add multiple labels
      </Text>
    </Stack>
  );
};
