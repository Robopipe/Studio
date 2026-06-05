import { useAuth } from "@/core/auth/hooks";
import { cameraApi } from "@/core/cameraApi";
import { useAppDispatch } from "@/hooks/redux";
import { Button } from "@/modules/shadcn/ui/button";
import { Project } from "@repo/schema";
import { useState } from "react";
import { setCameraApiOverride } from "../../services/cameraApiOverrideSlice";
import {
  useCreateProjectLabelMutation,
  useGetProjectLabelsQuery,
  useUpdateProjectLabelMutation,
  useUpdateProjectMutation,
} from "../../services/projectApi";
import { readCameraApiOverride } from "../../utils/cameraApiOverride";
import { LabelingSetup, LocalLabel } from "../LabelingSetup";
import { Modal, ModalTab } from "../Modal";
import { ProjectDetailsForm } from "../ProjectDetailsForm";

interface EditProjectModalProps {
  project: Project;
  initialTabId?: string;
  onClose: () => void;
}

export const EditProjectModal = ({
  project,
  initialTabId,
  onClose,
}: EditProjectModalProps) => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [cameraApiUrl, setCameraApiUrl] = useState<string | null>(
    project.cameraApiUrl,
  );
  const [localOverride, setLocalOverride] = useState<string>(
    () => readCameraApiOverride(user?.id, project.id) ?? "",
  );
  const [multipleDashboardConfigs] = useState(project.multipleDashboardConfigs);

  const { data: existingLabels } = useGetProjectLabelsQuery({
    projectId: project.id,
  });

  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [createLabel] = useCreateProjectLabelMutation();
  const [updateLabel] = useUpdateProjectLabelMutation();

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

      if (user) {
        const trimmed = localOverride.trim();
        dispatch(
          setCameraApiOverride({
            userId: user.id,
            projectId: project.id,
            value: trimmed || null,
          }),
        );
      }

      // Eagerly reset cameraApi when the project URL changes so any in-flight
      // request against the old URL is aborted before the project list refetches.
      if (cameraApiUrl !== project.cameraApiUrl) {
        dispatch(cameraApi.util.resetApiState());
      }

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
          localOverride={localOverride}
          setLocalOverride={setLocalOverride}
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
          onUpdateLabelColor={(labelName, color) => {
            const target = existingLabels?.find((l) => l.name === labelName);
            if (target) {
              updateLabel({
                projectId: project.id,
                labelId: target.id,
                name: target.name,
                color,
              });
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
      initialTabId={initialTabId}
      onClose={onClose}
    />
  );
};
