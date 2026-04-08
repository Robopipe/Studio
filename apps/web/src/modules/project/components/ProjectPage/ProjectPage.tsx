import { Button } from "@/modules/shadcn/ui/button";
import { Input } from "@/modules/shadcn/ui/input";
import { Label as ShadcnLabel } from "@/modules/shadcn/ui/label";
import { Spinner } from "@/modules/shadcn/ui/spinner";
import { FormEvent } from "react";
import { useParams } from "react-router";
import z from "zod";
import {
  useCreateProjectLabelMutation,
  useDeleteProjectLabelMutation,
  useGetProjectLabelsQuery,
  useGetProjectQuery,
} from "../../services/projectApi";

import { getRandomHex } from "../LabelingSetup";
import { LabelChip } from "../LabelChip";

export interface ProjectPageProps {}

export const ProjectPage = ({}: ProjectPageProps) => {
  const { projectId: projectIdRaw } = useParams();
  const projectId = z.coerce.number().parse(projectIdRaw);
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
    <div className="flex w-full flex-col gap-4">
      <h5 className="text-xl font-semibold">{project.name}</h5>

      <span className="text-base">Add Label Names</span>

      <div className="flex flex-row gap-4">
        <form
          onSubmit={handleSubmit}
          className="flex min-w-[400px] max-w-[500px] flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <ShadcnLabel htmlFor="labelName">Label Name</ShadcnLabel>
            <Input
              id="labelName"
              name="labelName"
              type="text"
              placeholder="Label name"
              required
            />
            <p className="text-xs text-muted-foreground">Enter a label name</p>
          </div>
          <Button type="submit" className="w-fit">
            Add Labels
          </Button>
        </form>
        <div className="flex flex-col gap-4">
          <span className="text-base font-bold">
            Labels ({labels?.length})
          </span>
          {labels?.map((label) => (
            <LabelChip
              key={label.id}
              label={label}
              onRemove={() =>
                deleteProjectLabel({ projectId, labelId: label.id })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};
