import { Project } from "@repo/schema";
import { Button, Stack } from "@repo/ui";
import { useState } from "react";
import {
  useCreateProjectLabelMutation,
  useDeleteProjectLabelMutation,
  useGetProjectLabelsQuery,
  useUpdateProjectMutation,
} from "../../services/projectApi";
import { LabelingSetup, LocalLabel } from "../LabelingSetup";
import { Modal, ModalTab } from "../Modal";
import { ProjectDetailsForm } from "../ProjectDetailsForm";

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
}

export const EditProjectModal = ({
  project,
  onClose,
}: EditProjectModalProps) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [cameraApiUrl, setCameraApiUrl] = useState<string | null>(
    project.cameraApiUrl,
  );
  const [multipleDashboardConfigs, setMultipleDashboardConfigs] = useState(
    project.multipleDashboardConfigs,
  );

  const { data: existingLabels } = useGetProjectLabelsQuery({
    projectId: project.id,
  });

  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [createLabel] = useCreateProjectLabelMutation();
  const [deleteLabel] = useDeleteProjectLabelMutation();

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      await updateProject({
        projectId: project.id,
        name,
        description,
        cameraApiUrl,
        multipleDashboardConfigs,
      }).unwrap();

      onClose();
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const tabs: ModalTab[] = [
    {
      id: "details",
      label: "Projects Details",
      content: (
        <ProjectDetailsForm
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          cameraApiUrl={cameraApiUrl}
          setCameraApiUrl={setCameraApiUrl}
          projectType={project.type}
          multipleDashboardConfigs={multipleDashboardConfigs}
          setMultipleDashboardConfigs={setMultipleDashboardConfigs}
        />
      ),
    },
    {
      id: "labeling",
      label: "Labeling Setup",
      content: (
        <LabelingSetup
          labels={(existingLabels || []) as LocalLabel[]}
          onAddLabel={(label) =>
            createLabel({ projectId: project.id, ...label })
          }
          onRemoveLabel={(labelName) => {
            const labelToDelete = existingLabels?.find(
              (l) => l.name === labelName,
            );
            if (labelToDelete) {
              deleteLabel({ projectId: project.id, labelId: labelToDelete.id });
            }
          }}
        />
      ),
    },
  ];

  const buttons = (
    <Stack direction="row" gap={12}>
      <Button variant="danger" size="sm" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="filled"
        size="sm"
        onClick={handleSave}
        disabled={isUpdating || !name.trim()}
      >
        {isUpdating ? "Saving..." : "Save Changes"}
      </Button>
    </Stack>
  );

  return (
    <Modal
      title="Edit Project"
      tabs={tabs}
      closeButton={false}
      buttons={buttons}
      onClose={onClose}
    />
  );
};
