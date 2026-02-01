import {
  Button,
  Heading,
  Spinner,
  Stack,
  Text,
  TextInput,
  bui,
} from "@repo/ui";
import { FormEvent } from "react";
import { useParams } from "react-router";
import z from "zod";
import {
  useCreateProjectLabelMutation,
  useDeleteProjectLabelMutation,
  useGetProjectLabelsQuery,
  useGetProjectQuery,
} from "../../services/projectApi";

import { LabelChip } from "../LabelChip";
import styles from "./ProjectPage.module.scss";
import { getRandomHex } from '../LabelingSetup';

export interface ProjectPageProps {}

export const ProjectPage = ({}: ProjectPageProps) => {
  const { id } = useParams();
  const projectId = z.coerce.number().parse(id);
  const { data: project, isLoading } = useGetProjectQuery({ projectId });
  const [createProjectLabel] = useCreateProjectLabelMutation();
  const { data: labels } = useGetProjectLabelsQuery({ projectId });
  const [deleteProjectLabel] = useDeleteProjectLabelMutation();

  if (isLoading) {
    return <Spinner />;
  }
  if (!project) {
    throw new Error("Project not found");
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const labelName = formData.get("labelName") as string;

    createProjectLabel({
      projectId,
      name: labelName,
      color: getRandomHex(),
    });
  };

  return (
    <Stack fullWidth gap="md">
      <Heading variant="h5" weight="600">
        {project.name}
      </Heading>

      <Text variant="text-16" weight="600">
        Add Label Names
      </Text>

      <Stack gap="md" direction="row">
        <bui.Form onSubmit={handleSubmit} className={styles.form}>
          <TextInput
            label="Label Name"
            name="labelName"
            type="text"
            placeholder="Label name"
            helperText="Enter a label name"
            required
          />
          <Button type="submit">Add Labels</Button>
        </bui.Form>
        <Stack gap="md">
          <Text variant="text-16" weight="700">
            Labels ({labels?.length})
          </Text>
          {labels?.map((label) => (
            <LabelChip
              key={label.id}
              label={label}
              onRemove={() =>
                deleteProjectLabel({ projectId, labelId: label.id })
              }
            />
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
};
