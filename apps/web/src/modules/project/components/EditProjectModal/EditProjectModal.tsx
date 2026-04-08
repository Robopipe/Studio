import { Button } from "@/modules/shadcn/ui/button";
import { Project } from "@repo/schema";
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
  const [multipleDashboardConfigs] = useState(project.multipleDashboardConfigs);

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
    <div className="flex flex-row gap-3">
      <Button variant="destructive" size="sm" onClick={onClose}>
        Cancel
      </Button>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={isUpdating || !name.trim()}
      >
        {isUpdating ? "Saving..." : "Save Changes"}
      </Button>
    </div>
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
