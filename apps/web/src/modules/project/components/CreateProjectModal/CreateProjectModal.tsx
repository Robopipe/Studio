import { Button } from "@/modules/shadcn/ui/button";
import { ProjectTypeEnum } from "@repo/schema";
import { useState } from "react";
import {
  useCreateProjectLabelMutation,
  useCreateProjectMutation,
} from "../../services/projectApi";
import { LabelingSetup, LocalLabel } from "../LabelingSetup/LabelingSetup";
import { Modal, ModalTab } from "../Modal";
import { ProjectDetailsForm } from "../ProjectDetailsForm";

interface CreateProjectModalProps {
  onClose: () => void;
  initialName?: string;
}

export const CreateProjectModal = ({
  onClose,
  initialName,
}: CreateProjectModalProps) => {
  const [name, setName] = useState(initialName ?? "");
  const [description, setDescription] = useState("");
  const [cameraApiUrl, setCameraApiUrl] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<ProjectTypeEnum>(
    ProjectTypeEnum.SEGMENTATION,
  );
  const [localLabels, setLocalLabels] = useState<LocalLabel[]>([]);

  const [createProject, { isLoading: isCreatingProject }] =
    useCreateProjectMutation();
  const [createLabel] = useCreateProjectLabelMutation();

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      const project = await createProject({
        name,
        description,
        type: projectType,
        cameraApiUrl,
      }).unwrap();

      if (localLabels.length > 0) {
        await Promise.all(
          localLabels.map((label) =>
            createLabel({
              projectId: project.id,
              name: label.name,
              color: label.color,
            }).unwrap(),
          ),
        );
      }

      onClose();
    } catch (error) {
      console.error("Project creation failed:", error);
    }
  };

  const handleAddLocalLabel = (label: LocalLabel) => {
    setLocalLabels((prev) => [...prev, label]);
  };

  const handleRemoveLocalLabel = (labelName: string) => {
    setLocalLabels((prev) => prev.filter((l) => l.name !== labelName));
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
          projectType={projectType}
          setProjectType={setProjectType}
        />
      ),
    },
    {
      id: "labeling",
      label: "Labeling Setup",
      content: (
        <LabelingSetup
          labels={localLabels}
          onAddLabel={handleAddLocalLabel}
          onRemoveLabel={handleRemoveLocalLabel}
        />
      ),
    },
  ];

  const buttons = (
    <div className="flex flex-row gap-3">
      <Button
        variant="destructive"
        size="sm"
        onClick={onClose}
        disabled={isCreatingProject}
      >
        Delete
      </Button>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={isCreatingProject || !name.trim()}
      >
        {isCreatingProject ? "Saving..." : "Save"}
      </Button>
    </div>
  );

  return (
    <Modal
      title="Create Project"
      tabs={tabs}
      closeButton={false}
      buttons={buttons}
      onClose={onClose}
    />
  );
};
